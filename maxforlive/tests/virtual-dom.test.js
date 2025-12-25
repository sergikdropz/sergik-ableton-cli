/**
 * @fileoverview Unit tests for VirtualDOM class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualDOM, h } from '../js/virtual-dom.js';

describe('VirtualDOM', () => {
    let container;
    let vdom;

    beforeEach(() => {
        document.body.innerHTML = '';
        container = document.createElement('div');
        document.body.appendChild(container);
        vdom = new VirtualDOM(container);
    });

    describe('render', () => {
        it('should render initial tree', () => {
            const vnode = h('div', { className: 'test' }, 'Hello');
            vdom.render(vnode);
            expect(container.innerHTML).toContain('Hello');
        });

        it('should update existing tree', () => {
            const vnode1 = h('div', { className: 'test' }, 'Hello');
            vdom.render(vnode1);
            
            const vnode2 = h('div', { className: 'test' }, 'World');
            vdom.render(vnode2);
            
            expect(container.textContent).toContain('World');
        });

        it('should handle nested children', () => {
            const vnode = h('div', {},
                h('span', {}, 'Hello'),
                h('span', {}, 'World')
            );
            vdom.render(vnode);
            expect(container.querySelectorAll('span').length).toBe(2);
        });
    });

    describe('key-based diffing', () => {
        it('should reuse nodes with same keys', () => {
            const vnode1 = h('div', {},
                h('span', { key: '1' }, 'First'),
                h('span', { key: '2' }, 'Second')
            );
            vdom.render(vnode1);
            
            const firstSpan = container.querySelector('span');
            
            const vnode2 = h('div', {},
                h('span', { key: '2' }, 'Second Updated'),
                h('span', { key: '1' }, 'First')
            );
            vdom.render(vnode2);
            
            // Should reuse the same DOM node
            const spans = container.querySelectorAll('span');
            expect(spans.length).toBe(2);
        });
    });

    describe('clear', () => {
        it('should clear container', () => {
            const vnode = h('div', {}, 'Hello');
            vdom.render(vnode);
            vdom.clear();
            expect(container.innerHTML).toBe('');
        });
    });

    describe('h helper', () => {
        it('should create virtual node', () => {
            const vnode = h('div', { className: 'test' }, 'Hello');
            expect(vnode.tag).toBe('div');
            expect(vnode.props?.className).toBe('test');
            expect(vnode.children).toBeDefined();
        });

        it('should handle string children', () => {
            const vnode = h('div', {}, 'Hello', 'World');
            expect(vnode.children?.length).toBe(2);
        });
    });
});

