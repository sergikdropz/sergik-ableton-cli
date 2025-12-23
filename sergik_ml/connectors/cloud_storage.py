"""
SERGIK ML Cloud Storage

Upload and manage sample packs in cloud storage:
  - AWS S3
  - Firebase Storage
  - Generic HTTP upload

Features:
  - Automatic compression
  - Progress tracking
  - CDN URL generation
  - Metadata tagging
"""

import logging
import os
import json
import hashlib
from pathlib import Path
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass
from datetime import datetime
import mimetypes

from ..config import CFG

logger = logging.getLogger(__name__)


@dataclass
class UploadResult:
    """Result of a cloud upload operation."""
    success: bool
    url: Optional[str] = None
    cdn_url: Optional[str] = None
    size_bytes: int = 0
    etag: Optional[str] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class CloudStorageBase:
    """Base class for cloud storage providers."""

    def upload(
        self,
        local_path: str,
        remote_path: str,
        metadata: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> UploadResult:
        """Upload a file to cloud storage."""
        raise NotImplementedError

    def download(
        self,
        remote_path: str,
        local_path: str,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> bool:
        """Download a file from cloud storage."""
        raise NotImplementedError

    def delete(self, remote_path: str) -> bool:
        """Delete a file from cloud storage."""
        raise NotImplementedError

    def list_files(self, prefix: str = "") -> list:
        """List files in cloud storage."""
        raise NotImplementedError

    def get_url(self, remote_path: str, expires_in: int = 3600) -> Optional[str]:
        """Get a signed URL for a file."""
        raise NotImplementedError


class S3Storage(CloudStorageBase):
    """
    AWS S3 cloud storage.

    Environment variables:
      - AWS_ACCESS_KEY_ID
      - AWS_SECRET_ACCESS_KEY
      - AWS_REGION (default: us-east-1)
      - SERGIK_S3_BUCKET
    """

    def __init__(self, bucket: Optional[str] = None):
        """Initialize S3 storage."""
        self.bucket = bucket or os.getenv("SERGIK_S3_BUCKET", "sergik-sample-packs")
        self.region = os.getenv("AWS_REGION", "us-east-1")
        self._client = None

    def _get_client(self):
        """Get or create S3 client."""
        if self._client is None:
            try:
                import boto3
                self._client = boto3.client("s3", region_name=self.region)
                logger.info(f"S3 client initialized for bucket: {self.bucket}")
            except ImportError:
                logger.error("boto3 not installed. Install: pip install boto3")
                raise
            except Exception as e:
                logger.error(f"S3 client init failed: {e}")
                raise
        return self._client

    def upload(
        self,
        local_path: str,
        remote_path: str,
        metadata: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> UploadResult:
        """Upload file to S3."""
        try:
            client = self._get_client()
            local_path = Path(local_path)

            if not local_path.exists():
                return UploadResult(success=False, error=f"File not found: {local_path}")

            file_size = local_path.stat().st_size
            content_type = mimetypes.guess_type(str(local_path))[0] or "application/octet-stream"

            # Prepare metadata
            extra_args = {
                "ContentType": content_type,
                "Metadata": {
                    "uploaded_at": datetime.utcnow().isoformat(),
                    "source": "sergik_ml",
                },
            }
            if metadata:
                extra_args["Metadata"].update({
                    k: str(v) for k, v in metadata.items()
                })

            # Upload with progress
            if progress_callback:
                from boto3.s3.transfer import TransferConfig
                config = TransferConfig(multipart_threshold=8 * 1024 * 1024)

                class ProgressTracker:
                    def __init__(self, total, callback):
                        self.total = total
                        self.callback = callback
                        self.uploaded = 0

                    def __call__(self, bytes_amount):
                        self.uploaded += bytes_amount
                        self.callback(self.uploaded, self.total)

                client.upload_file(
                    str(local_path),
                    self.bucket,
                    remote_path,
                    ExtraArgs=extra_args,
                    Callback=ProgressTracker(file_size, progress_callback),
                    Config=config,
                )
            else:
                client.upload_file(
                    str(local_path),
                    self.bucket,
                    remote_path,
                    ExtraArgs=extra_args,
                )

            # Get public URL
            url = f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{remote_path}"

            return UploadResult(
                success=True,
                url=url,
                cdn_url=url,  # Could be CloudFront URL
                size_bytes=file_size,
                metadata=extra_args["Metadata"],
            )

        except Exception as e:
            logger.error(f"S3 upload failed: {e}")
            return UploadResult(success=False, error=str(e))

    def download(
        self,
        remote_path: str,
        local_path: str,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> bool:
        """Download file from S3."""
        try:
            client = self._get_client()
            local_path = Path(local_path)
            local_path.parent.mkdir(parents=True, exist_ok=True)

            client.download_file(self.bucket, remote_path, str(local_path))
            return True

        except Exception as e:
            logger.error(f"S3 download failed: {e}")
            return False

    def delete(self, remote_path: str) -> bool:
        """Delete file from S3."""
        try:
            client = self._get_client()
            client.delete_object(Bucket=self.bucket, Key=remote_path)
            return True
        except Exception as e:
            logger.error(f"S3 delete failed: {e}")
            return False

    def list_files(self, prefix: str = "") -> list:
        """List files in S3 bucket."""
        try:
            client = self._get_client()
            response = client.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
            return [obj["Key"] for obj in response.get("Contents", [])]
        except Exception as e:
            logger.error(f"S3 list failed: {e}")
            return []

    def get_url(self, remote_path: str, expires_in: int = 3600) -> Optional[str]:
        """Get presigned URL for file."""
        try:
            client = self._get_client()
            url = client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": remote_path},
                ExpiresIn=expires_in,
            )
            return url
        except Exception as e:
            logger.error(f"S3 presign failed: {e}")
            return None


class FirebaseStorage(CloudStorageBase):
    """
    Firebase Storage.

    Environment variables:
      - GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)
      - SERGIK_FIREBASE_BUCKET
    """

    def __init__(self, bucket: Optional[str] = None):
        """Initialize Firebase storage."""
        self.bucket_name = bucket or os.getenv(
            "SERGIK_FIREBASE_BUCKET",
            "sergik-ml.appspot.com"
        )
        self._bucket = None

    def _get_bucket(self):
        """Get or create Firebase bucket."""
        if self._bucket is None:
            try:
                import firebase_admin
                from firebase_admin import credentials, storage

                # Initialize app if not already done
                if not firebase_admin._apps:
                    cred = credentials.ApplicationDefault()
                    firebase_admin.initialize_app(cred, {
                        "storageBucket": self.bucket_name
                    })

                self._bucket = storage.bucket()
                logger.info(f"Firebase bucket initialized: {self.bucket_name}")

            except ImportError:
                logger.error("firebase-admin not installed. Install: pip install firebase-admin")
                raise
            except Exception as e:
                logger.error(f"Firebase init failed: {e}")
                raise

        return self._bucket

    def upload(
        self,
        local_path: str,
        remote_path: str,
        metadata: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> UploadResult:
        """Upload file to Firebase Storage."""
        try:
            bucket = self._get_bucket()
            local_path = Path(local_path)

            if not local_path.exists():
                return UploadResult(success=False, error=f"File not found: {local_path}")

            blob = bucket.blob(remote_path)

            # Set metadata
            if metadata:
                blob.metadata = {k: str(v) for k, v in metadata.items()}

            blob.upload_from_filename(str(local_path))

            # Make public and get URL
            blob.make_public()
            url = blob.public_url

            return UploadResult(
                success=True,
                url=url,
                cdn_url=url,
                size_bytes=local_path.stat().st_size,
                metadata=metadata,
            )

        except Exception as e:
            logger.error(f"Firebase upload failed: {e}")
            return UploadResult(success=False, error=str(e))

    def download(
        self,
        remote_path: str,
        local_path: str,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> bool:
        """Download file from Firebase Storage."""
        try:
            bucket = self._get_bucket()
            blob = bucket.blob(remote_path)

            local_path = Path(local_path)
            local_path.parent.mkdir(parents=True, exist_ok=True)

            blob.download_to_filename(str(local_path))
            return True

        except Exception as e:
            logger.error(f"Firebase download failed: {e}")
            return False

    def delete(self, remote_path: str) -> bool:
        """Delete file from Firebase Storage."""
        try:
            bucket = self._get_bucket()
            blob = bucket.blob(remote_path)
            blob.delete()
            return True
        except Exception as e:
            logger.error(f"Firebase delete failed: {e}")
            return False

    def list_files(self, prefix: str = "") -> list:
        """List files in Firebase bucket."""
        try:
            bucket = self._get_bucket()
            blobs = bucket.list_blobs(prefix=prefix)
            return [blob.name for blob in blobs]
        except Exception as e:
            logger.error(f"Firebase list failed: {e}")
            return []

    def get_url(self, remote_path: str, expires_in: int = 3600) -> Optional[str]:
        """Get signed URL for file."""
        try:
            from datetime import timedelta
            bucket = self._get_bucket()
            blob = bucket.blob(remote_path)
            url = blob.generate_signed_url(expiration=timedelta(seconds=expires_in))
            return url
        except Exception as e:
            logger.error(f"Firebase sign failed: {e}")
            return None


class StubStorage(CloudStorageBase):
    """
    Stub storage for testing without cloud credentials.

    Simulates uploads by copying to local directory.
    """

    def __init__(self, base_dir: Optional[str] = None):
        """Initialize stub storage."""
        self.base_dir = Path(base_dir or CFG.artifact_dir) / "cloud_stub"
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def upload(
        self,
        local_path: str,
        remote_path: str,
        metadata: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> UploadResult:
        """Simulate upload by copying locally."""
        try:
            local_path = Path(local_path)
            if not local_path.exists():
                return UploadResult(success=False, error=f"File not found: {local_path}")

            # Copy file
            dest = self.base_dir / remote_path
            dest.parent.mkdir(parents=True, exist_ok=True)

            import shutil
            shutil.copy2(local_path, dest)

            # Save metadata
            if metadata:
                meta_path = dest.with_suffix(dest.suffix + ".meta.json")
                meta_path.write_text(json.dumps(metadata, indent=2))

            url = f"file://{dest.absolute()}"

            return UploadResult(
                success=True,
                url=url,
                cdn_url=url,
                size_bytes=local_path.stat().st_size,
                metadata=metadata,
            )

        except Exception as e:
            logger.error(f"Stub upload failed: {e}")
            return UploadResult(success=False, error=str(e))

    def download(
        self,
        remote_path: str,
        local_path: str,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> bool:
        """Download from stub storage."""
        try:
            import shutil
            src = self.base_dir / remote_path
            shutil.copy2(src, local_path)
            return True
        except Exception as e:
            logger.error(f"Stub download failed: {e}")
            return False

    def delete(self, remote_path: str) -> bool:
        """Delete from stub storage."""
        try:
            path = self.base_dir / remote_path
            if path.exists():
                path.unlink()
            return True
        except Exception as e:
            logger.error(f"Stub delete failed: {e}")
            return False

    def list_files(self, prefix: str = "") -> list:
        """List files in stub storage."""
        try:
            pattern = f"{prefix}*" if prefix else "*"
            return [str(p.relative_to(self.base_dir)) for p in self.base_dir.rglob(pattern)]
        except Exception as e:
            logger.error(f"Stub list failed: {e}")
            return []

    def get_url(self, remote_path: str, expires_in: int = 3600) -> Optional[str]:
        """Get URL for stub file."""
        path = self.base_dir / remote_path
        if path.exists():
            return f"file://{path.absolute()}"
        return None


# ============================================================================
# Factory and Global Access
# ============================================================================

def get_storage(provider: str = "auto") -> CloudStorageBase:
    """
    Get cloud storage provider.

    Args:
        provider: 's3', 'firebase', 'stub', or 'auto'

    Returns:
        CloudStorageBase instance
    """
    if provider == "auto":
        # Try S3 first
        if os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("SERGIK_S3_BUCKET"):
            provider = "s3"
        # Try Firebase
        elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            provider = "firebase"
        else:
            provider = "stub"

    if provider == "s3":
        return S3Storage()
    elif provider == "firebase":
        return FirebaseStorage()
    else:
        return StubStorage()


def upload_pack(
    zip_path: str,
    pack_id: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> UploadResult:
    """
    Upload a sample pack to cloud storage.

    Args:
        zip_path: Path to ZIP file
        pack_id: Pack identifier
        metadata: Optional pack metadata

    Returns:
        UploadResult
    """
    storage = get_storage()

    remote_path = f"packs/{pack_id}/{Path(zip_path).name}"

    pack_metadata = {
        "pack_id": pack_id,
        "uploaded_at": datetime.utcnow().isoformat(),
        "source": "sergik_ml",
    }
    if metadata:
        pack_metadata.update(metadata)

    return storage.upload(zip_path, remote_path, pack_metadata)
