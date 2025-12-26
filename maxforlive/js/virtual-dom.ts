/**
 * @fileoverview Virtual DOM - Lightweight virtual DOM for efficient rendering
 * @module virtual-dom
 */

/**
 * Virtual node type
 */
export type VNode = {
    tag: string;
    props?: Record<string, any>;
    children?: (VNode | string)[];
    key?: string | number;
};

/**
 * Virtual DOM class for efficient DOM updates
 */
export class VirtualDOM {
    private container: HTMLElement;
    private currentTree: VNode | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    /**
     * Render virtual node tree to DOM
     */
    render(vnode: VNode): void {
        if (!vnode) return;

        const newTree = vnode;
        
        if (!this.currentTree) {
            // Initial render
            this.container.appendChild(this.createDOMNode(newTree));
        } else {
            // Update existing tree
            this.updateNode(this.container, this.currentTree, newTree);
        }

        this.currentTree = newTree;
    }

    /**
     * Create DOM node from virtual node
     */
    private createDOMNode(vnode: VNode): Node {
        if (typeof vnode === 'string') {
            return document.createTextNode(vnode);
        }

        const element = document.createElement(vnode.tag);

        // Set properties
        if (vnode.props) {
            Object.entries(vnode.props).forEach(([key, value]) => {
            if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                const eventName = key.slice(2).toLowerCase();
                element.addEventListener(eventName, value);
            } else if (key === 'className') {
                element.className = value;
            } else if (key !== 'key') {
                element.setAttribute(key, String(value));
            }
            });
        }

        // Add children
        if (vnode.children) {
            vnode.children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(this.createDOMNode(child));
                }
            });
        }

        return element;
    }

    /**
     * Update DOM node based on virtual node diff
     */
    private updateNode(container: Node, oldVNode: VNode, newVNode: VNode): void {
        if (!oldVNode) {
            container.appendChild(this.createDOMNode(newVNode));
            return;
        }

        if (!newVNode) {
            container.removeChild(container.firstChild!);
            return;
        }

        if (typeof oldVNode === 'string' || typeof newVNode === 'string') {
            if (oldVNode !== newVNode) {
                container.replaceChild(
                    this.createDOMNode(newVNode),
                    container.firstChild!
                );
            }
            return;
        }

        // Update element if tag changed
        if (oldVNode.tag !== newVNode.tag) {
            container.replaceChild(
                this.createDOMNode(newVNode),
                container.firstChild!
            );
            return;
        }

        const element = container.firstChild as HTMLElement;

        // Update properties
        this.updateProps(element, oldVNode.props || {}, newVNode.props || {});

        // Update children
        this.updateChildren(element, oldVNode.children || [], newVNode.children || []);
    }

    /**
     * Update element properties
     */
    private updateProps(element: HTMLElement, oldProps: Record<string, any>, newProps: Record<string, any>): void {
        // Remove old props
        Object.keys(oldProps).forEach(key => {
            if (!(key in newProps)) {
                if (key === 'style' && typeof oldProps[key] === 'object') {
                    Object.keys(oldProps[key]).forEach(styleKey => {
                        (element.style as any)[styleKey] = '';
                    });
                } else if (key.startsWith('on')) {
                    const eventName = key.slice(2).toLowerCase();
                    element.removeEventListener(eventName, oldProps[key]);
                } else if (key === 'className') {
                    element.className = '';
                } else if (key !== 'key') {
                    element.removeAttribute(key);
                }
            }
        });

        // Add/update new props
        Object.entries(newProps).forEach(([key, value]) => {
            if (oldProps[key] !== value) {
                if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else if (key.startsWith('on') && typeof value === 'function') {
                    const eventName = key.slice(2).toLowerCase();
                    if (oldProps[key]) {
                        element.removeEventListener(eventName, oldProps[key]);
                    }
                    element.addEventListener(eventName, value);
                } else if (key === 'className') {
                    element.className = value;
                } else if (key !== 'key') {
                    element.setAttribute(key, String(value));
                }
            }
        });
    }

    /**
     * Update children efficiently using key-based diffing
     */
    private updateChildren(container: HTMLElement, oldChildren: (VNode | string)[], newChildren: (VNode | string)[]): void {
        // Create key maps for efficient lookup
        const oldKeyMap = new Map<string | number, { node: VNode | string; index: number; domNode: Node }>();
        const newKeyMap = new Map<string | number, { node: VNode | string; index: number }>();

        // Build old key map
        oldChildren.forEach((child, index) => {
            if (typeof child !== 'string' && child.key !== undefined) {
                oldKeyMap.set(child.key, { node: child, index, domNode: container.childNodes[index] });
            }
        });

        // Build new key map
        newChildren.forEach((child, index) => {
            if (typeof child !== 'string' && child.key !== undefined) {
                newKeyMap.set(child.key, { node: child, index });
            }
        });

        // Track which keys are in use
        const usedKeys = new Set<string | number>();
        const newChildNodes: Node[] = [];

        // Process new children
        newChildren.forEach((newChild) => {
            const newKey = typeof newChild !== 'string' ? newChild.key : undefined;
            
            if (newKey !== undefined && oldKeyMap.has(newKey)) {
                // Key exists in old tree - reuse node
                const oldEntry = oldKeyMap.get(newKey)!;
                const domNode = oldEntry.domNode;
                
                // Update the node if needed
                if (typeof oldEntry.node !== 'string' && typeof newChild !== 'string') {
                    this.updateNode(domNode, oldEntry.node, newChild);
                }
                
                newChildNodes.push(domNode);
                usedKeys.add(newKey);
            } else {
                // New node - create it
                const newNode = this.createDOMNode(typeof newChild === 'string' ? { tag: '#text', children: [newChild] } : newChild);
                newChildNodes.push(newNode);
            }
        });

        // Remove unused old nodes
        oldKeyMap.forEach((entry, key) => {
            if (!usedKeys.has(key) && entry.domNode.parentNode === container) {
                container.removeChild(entry.domNode);
            }
        });

        // Reorder nodes to match new order
        newChildNodes.forEach((node, index) => {
            const currentChild = container.childNodes[index];
            if (currentChild !== node) {
                if (currentChild) {
                    container.insertBefore(node, currentChild);
                } else {
                    container.appendChild(node);
                }
            }
        });

        // Fallback to index-based diffing if no keys are present
        if (oldKeyMap.size === 0 && newKeyMap.size === 0) {
            this.updateChildrenByIndex(container, oldChildren, newChildren);
        }
    }

    /**
     * Fallback: Update children using index-based diffing (when no keys)
     */
    private updateChildrenByIndex(container: HTMLElement, oldChildren: (VNode | string)[], newChildren: (VNode | string)[]): void {
        const maxLength = Math.max(oldChildren.length, newChildren.length);

        for (let i = 0; i < maxLength; i++) {
            const oldChild = oldChildren[i];
            const newChild = newChildren[i];
            const childNode = container.childNodes[i];

            if (!oldChild && newChild) {
                // Add new child
                container.appendChild(this.createDOMNode(typeof newChild === 'string' ? { tag: '#text', children: [newChild] } : newChild));
            } else if (oldChild && !newChild) {
                // Remove old child
                if (childNode) {
                    container.removeChild(childNode);
                }
            } else if (oldChild && newChild) {
                // Update existing child
                if (childNode) {
                    this.updateNode(childNode, typeof oldChild === 'string' ? { tag: '#text', children: [oldChild] } : oldChild, typeof newChild === 'string' ? { tag: '#text', children: [newChild] } : newChild);
                }
            }
        }
    }

    /**
     * Clear virtual DOM
     */
    clear(): void {
        this.container.innerHTML = '';
        this.currentTree = null;
    }
}

/**
 * Helper function to create virtual nodes
 * @param {string} tag
 * @param {Record<string, any>} [props]
 * @param {...(VNode | string)} children
 * @returns {VNode}
 */
export function h(tag, props, ...children) {
    // Handle case where children is passed as array
    const childArray = children.length === 1 && Array.isArray(children[0]) 
        ? children[0] 
        : children;
    
    return {
        tag,
        props,
        children: childArray.length > 0 ? childArray : undefined
    };
}

