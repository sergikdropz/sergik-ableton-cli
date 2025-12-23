"""
SERGIK ML Contextual Bandits

Advanced preference learning with exploration/exploitation:
  - Thompson Sampling for exploration
  - Upper Confidence Bound (UCB)
  - Epsilon-greedy
  - LinUCB for contextual bandits

Use cases:
  - New track discovery (balance known favorites vs exploration)
  - A/B testing for model versions
  - Personalized recommendations
"""

import logging
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class BanditArm:
    """Represents a single arm (track/option) in the bandit."""
    arm_id: str
    features: np.ndarray
    pulls: int = 0
    total_reward: float = 0.0
    mean_reward: float = 0.0
    variance: float = 1.0
    last_pulled: Optional[datetime] = None


@dataclass
class BanditState:
    """State of the bandit algorithm."""
    total_pulls: int = 0
    total_reward: float = 0.0
    arms: Dict[str, BanditArm] = field(default_factory=dict)


class EpsilonGreedy:
    """
    Epsilon-greedy bandit algorithm.

    With probability epsilon, explore randomly.
    Otherwise, exploit the best-known arm.
    """

    def __init__(self, epsilon: float = 0.1, decay: float = 0.999):
        """
        Initialize epsilon-greedy bandit.

        Args:
            epsilon: Exploration probability (0-1)
            decay: Epsilon decay per pull
        """
        self.epsilon = epsilon
        self.initial_epsilon = epsilon
        self.decay = decay
        self.state = BanditState()

    def add_arm(self, arm_id: str, features: np.ndarray) -> None:
        """Add a new arm to the bandit."""
        self.state.arms[arm_id] = BanditArm(
            arm_id=arm_id,
            features=features,
        )

    def select_arm(self, available_arms: Optional[List[str]] = None) -> str:
        """
        Select an arm using epsilon-greedy strategy.

        Args:
            available_arms: Subset of arms to choose from

        Returns:
            Selected arm ID
        """
        arms = available_arms or list(self.state.arms.keys())

        if not arms:
            raise ValueError("No arms available")

        # Explore with probability epsilon
        if np.random.random() < self.epsilon:
            return np.random.choice(arms)

        # Exploit: select arm with highest mean reward
        best_arm = None
        best_reward = float("-inf")

        for arm_id in arms:
            if arm_id in self.state.arms:
                arm = self.state.arms[arm_id]
                if arm.mean_reward > best_reward:
                    best_reward = arm.mean_reward
                    best_arm = arm_id

        return best_arm or np.random.choice(arms)

    def update(self, arm_id: str, reward: float) -> None:
        """
        Update arm statistics after receiving reward.

        Args:
            arm_id: Arm that was pulled
            reward: Observed reward
        """
        if arm_id not in self.state.arms:
            logger.warning(f"Unknown arm: {arm_id}")
            return

        arm = self.state.arms[arm_id]
        arm.pulls += 1
        arm.total_reward += reward
        arm.mean_reward = arm.total_reward / arm.pulls
        arm.last_pulled = datetime.utcnow()

        self.state.total_pulls += 1
        self.state.total_reward += reward

        # Decay epsilon
        self.epsilon *= self.decay


class ThompsonSampling:
    """
    Thompson Sampling bandit algorithm.

    Models each arm's reward distribution as Beta(alpha, beta).
    Samples from posterior and selects arm with highest sample.

    Best for:
      - Binary rewards (like/dislike)
      - Bayesian exploration
    """

    def __init__(self, prior_alpha: float = 1.0, prior_beta: float = 1.0):
        """
        Initialize Thompson Sampling bandit.

        Args:
            prior_alpha: Prior alpha for Beta distribution
            prior_beta: Prior beta for Beta distribution
        """
        self.prior_alpha = prior_alpha
        self.prior_beta = prior_beta
        self.alphas: Dict[str, float] = {}
        self.betas: Dict[str, float] = {}
        self.state = BanditState()

    def add_arm(self, arm_id: str, features: np.ndarray) -> None:
        """Add a new arm."""
        self.state.arms[arm_id] = BanditArm(
            arm_id=arm_id,
            features=features,
        )
        self.alphas[arm_id] = self.prior_alpha
        self.betas[arm_id] = self.prior_beta

    def select_arm(self, available_arms: Optional[List[str]] = None) -> str:
        """
        Select arm using Thompson Sampling.

        Samples from each arm's posterior and selects highest.
        """
        arms = available_arms or list(self.state.arms.keys())

        if not arms:
            raise ValueError("No arms available")

        # Sample from each arm's Beta distribution
        samples = {}
        for arm_id in arms:
            alpha = self.alphas.get(arm_id, self.prior_alpha)
            beta = self.betas.get(arm_id, self.prior_beta)
            samples[arm_id] = np.random.beta(alpha, beta)

        # Select arm with highest sample
        return max(samples.keys(), key=lambda x: samples[x])

    def update(self, arm_id: str, reward: float) -> None:
        """
        Update posterior after observing reward.

        For binary rewards: reward=1 -> alpha++, reward=0 -> beta++
        For continuous rewards [0,1]: interpret as probability
        """
        if arm_id not in self.state.arms:
            logger.warning(f"Unknown arm: {arm_id}")
            return

        # Normalize reward to [0, 1]
        reward = max(0.0, min(1.0, reward))

        # Update Beta distribution
        self.alphas[arm_id] = self.alphas.get(arm_id, self.prior_alpha) + reward
        self.betas[arm_id] = self.betas.get(arm_id, self.prior_beta) + (1 - reward)

        # Update arm stats
        arm = self.state.arms[arm_id]
        arm.pulls += 1
        arm.total_reward += reward
        arm.mean_reward = arm.total_reward / arm.pulls
        arm.last_pulled = datetime.utcnow()

        self.state.total_pulls += 1
        self.state.total_reward += reward


class UCB:
    """
    Upper Confidence Bound (UCB) bandit algorithm.

    Balances exploration and exploitation using confidence intervals.
    Selects arm with highest upper confidence bound.

    UCB = mean_reward + c * sqrt(log(total_pulls) / arm_pulls)
    """

    def __init__(self, c: float = 2.0):
        """
        Initialize UCB bandit.

        Args:
            c: Exploration parameter (higher = more exploration)
        """
        self.c = c
        self.state = BanditState()

    def add_arm(self, arm_id: str, features: np.ndarray) -> None:
        """Add a new arm."""
        self.state.arms[arm_id] = BanditArm(
            arm_id=arm_id,
            features=features,
        )

    def select_arm(self, available_arms: Optional[List[str]] = None) -> str:
        """
        Select arm using UCB.

        Returns arm with highest upper confidence bound.
        """
        arms = available_arms or list(self.state.arms.keys())

        if not arms:
            raise ValueError("No arms available")

        # First, try arms that haven't been pulled
        for arm_id in arms:
            if arm_id in self.state.arms and self.state.arms[arm_id].pulls == 0:
                return arm_id

        # Calculate UCB for each arm
        total_pulls = max(1, self.state.total_pulls)
        ucb_scores = {}

        for arm_id in arms:
            if arm_id in self.state.arms:
                arm = self.state.arms[arm_id]
                if arm.pulls > 0:
                    exploration = self.c * np.sqrt(np.log(total_pulls) / arm.pulls)
                    ucb_scores[arm_id] = arm.mean_reward + exploration
                else:
                    ucb_scores[arm_id] = float("inf")

        return max(ucb_scores.keys(), key=lambda x: ucb_scores[x])

    def update(self, arm_id: str, reward: float) -> None:
        """Update arm statistics."""
        if arm_id not in self.state.arms:
            return

        arm = self.state.arms[arm_id]
        arm.pulls += 1
        arm.total_reward += reward
        arm.mean_reward = arm.total_reward / arm.pulls
        arm.last_pulled = datetime.utcnow()

        self.state.total_pulls += 1
        self.state.total_reward += reward


class LinUCB:
    """
    Linear Upper Confidence Bound (LinUCB) for contextual bandits.

    Uses linear regression to model reward as function of context.
    Maintains uncertainty estimates for exploration.

    Best for:
      - Contextual recommendations
      - Feature-based decisions
    """

    def __init__(self, feature_dim: int, alpha: float = 1.0):
        """
        Initialize LinUCB.

        Args:
            feature_dim: Dimension of feature vectors
            alpha: Exploration parameter
        """
        self.feature_dim = feature_dim
        self.alpha = alpha

        # Per-arm linear model parameters
        self.A: Dict[str, np.ndarray] = {}  # d x d matrix
        self.b: Dict[str, np.ndarray] = {}  # d vector
        self.state = BanditState()

    def add_arm(self, arm_id: str, features: np.ndarray) -> None:
        """Add a new arm with context."""
        self.state.arms[arm_id] = BanditArm(
            arm_id=arm_id,
            features=features,
        )
        # Initialize with identity matrix
        self.A[arm_id] = np.eye(self.feature_dim)
        self.b[arm_id] = np.zeros(self.feature_dim)

    def select_arm(
        self,
        context: np.ndarray,
        available_arms: Optional[List[str]] = None,
    ) -> str:
        """
        Select arm given context.

        Args:
            context: Current context feature vector
            available_arms: Subset of arms to choose from

        Returns:
            Selected arm ID
        """
        arms = available_arms or list(self.state.arms.keys())

        if not arms:
            raise ValueError("No arms available")

        # Ensure context is right shape
        context = np.array(context, dtype=np.float32).flatten()
        if len(context) != self.feature_dim:
            raise ValueError(f"Context dim mismatch: {len(context)} != {self.feature_dim}")

        ucb_scores = {}

        for arm_id in arms:
            if arm_id not in self.A:
                # New arm - high uncertainty
                ucb_scores[arm_id] = float("inf")
                continue

            A = self.A[arm_id]
            b = self.b[arm_id]

            # Compute theta (linear weights)
            A_inv = np.linalg.inv(A)
            theta = A_inv @ b

            # Compute UCB
            mean = context @ theta
            variance = context @ A_inv @ context
            ucb_scores[arm_id] = mean + self.alpha * np.sqrt(variance)

        return max(ucb_scores.keys(), key=lambda x: ucb_scores[x])

    def update(self, arm_id: str, context: np.ndarray, reward: float) -> None:
        """
        Update model after observing reward.

        Args:
            arm_id: Selected arm
            context: Context when arm was selected
            reward: Observed reward
        """
        if arm_id not in self.A:
            self.add_arm(arm_id, context)

        context = np.array(context, dtype=np.float32).flatten()

        # Update A and b
        self.A[arm_id] += np.outer(context, context)
        self.b[arm_id] += reward * context

        # Update arm stats
        if arm_id in self.state.arms:
            arm = self.state.arms[arm_id]
            arm.pulls += 1
            arm.total_reward += reward
            arm.mean_reward = arm.total_reward / arm.pulls
            arm.last_pulled = datetime.utcnow()

        self.state.total_pulls += 1
        self.state.total_reward += reward


# ============================================================================
# Track Recommendation Bandit
# ============================================================================

class TrackRecommendationBandit:
    """
    Specialized bandit for SERGIK track recommendations.

    Combines contextual features with exploration.
    """

    def __init__(
        self,
        algorithm: str = "thompson",
        feature_dim: int = 7,
        exploration_rate: float = 0.1,
    ):
        """
        Initialize track recommendation bandit.

        Args:
            algorithm: 'thompson', 'ucb', 'epsilon', or 'linucb'
            feature_dim: Dimension of track features
            exploration_rate: Exploration parameter
        """
        self.algorithm = algorithm
        self.feature_dim = feature_dim

        if algorithm == "thompson":
            self.bandit = ThompsonSampling()
        elif algorithm == "ucb":
            self.bandit = UCB(c=exploration_rate)
        elif algorithm == "epsilon":
            self.bandit = EpsilonGreedy(epsilon=exploration_rate)
        elif algorithm == "linucb":
            self.bandit = LinUCB(feature_dim=feature_dim, alpha=exploration_rate)
        else:
            raise ValueError(f"Unknown algorithm: {algorithm}")

    def add_track(self, track_id: str, features: np.ndarray) -> None:
        """Add a track as an arm."""
        self.bandit.add_arm(track_id, features)

    def recommend(
        self,
        context: Optional[np.ndarray] = None,
        candidates: Optional[List[str]] = None,
        k: int = 5,
    ) -> List[str]:
        """
        Recommend tracks using bandit.

        Args:
            context: Optional context features
            candidates: Pool of candidate track IDs
            k: Number of recommendations

        Returns:
            List of recommended track IDs
        """
        recommendations = []

        for _ in range(k):
            if self.algorithm == "linucb" and context is not None:
                remaining = [c for c in (candidates or list(self.bandit.state.arms.keys()))
                            if c not in recommendations]
                if not remaining:
                    break
                selected = self.bandit.select_arm(context, remaining)
            else:
                remaining = [c for c in (candidates or list(self.bandit.state.arms.keys()))
                            if c not in recommendations]
                if not remaining:
                    break
                selected = self.bandit.select_arm(remaining)

            recommendations.append(selected)

        return recommendations

    def record_feedback(
        self,
        track_id: str,
        rating: float,
        context: Optional[np.ndarray] = None,
    ) -> None:
        """
        Record user feedback for a track.

        Args:
            track_id: Track that was rated
            rating: User rating (1-5)
            context: Context when track was played
        """
        # Normalize rating to [0, 1]
        normalized = (rating - 1) / 4.0

        if self.algorithm == "linucb" and context is not None:
            self.bandit.update(track_id, context, normalized)
        else:
            self.bandit.update(track_id, normalized)

    def get_stats(self) -> Dict[str, Any]:
        """Get bandit statistics."""
        return {
            "algorithm": self.algorithm,
            "total_pulls": self.bandit.state.total_pulls,
            "total_reward": self.bandit.state.total_reward,
            "num_arms": len(self.bandit.state.arms),
            "avg_reward": (
                self.bandit.state.total_reward / max(1, self.bandit.state.total_pulls)
            ),
        }
