import { useState, useEffect, useCallback } from 'react';

const leftArrow = 37;
const upArrow = 38;
const rightArrow = 39;
const downArrow = 40;
const tab = 9;

/**
 * useTabIndexGroup hook options
 * @typedef {Object} Options
 * @property {Boolean} [autoFocus=false]
 * @property {Boolean} [useArrows=false]
 * @property {Boolean} [debug=false]
 */

/**
 *
 * @param {Options} options
 * @returns {Function}
 */

const useTabIndexGroup = (options = {}) => {
    const { autoFocus, useArrows, debug } = options;
    let shiftPressed = false;


    const [nodes, setNodes] = useState([]);
    const [activeIndex, setActiveIndex] = useState(null);
    const [rootNode, setRootNode] = useState(null);

    const getRootRef = node => setRootNode(node);

    const log = (...message) => {
        if (debug) console.log(...message);
    };

    const updateNodes = useCallback(rootNode => {
        const selectedNodes = Array.from(rootNode.querySelectorAll('[tabindex]:not([tabindex=""])'))
            .filter(node => node.getAttribute('tabindex') > 0);

        log('selectedNodes', selectedNodes);

        if (selectedNodes && selectedNodes.length) {
            const sortedNodes = selectedNodes.sort((a, b) => {
                const aIndex = a.getAttribute('tabindex');
                const bIndex = b.getAttribute('tabindex');
                if (aIndex < bIndex) return -1;
                if (aIndex > bIndex) return 1;
                return 0;
            });

            if (autoFocus) {
                log('focus');
                process.nextTick(() => sortedNodes[0].focus());
            }

            setNodes(sortedNodes);
        }
    }, []);

    const changeActiveIndex = useCallback(action => {
        let indexToFocus;
        switch (action) {
            case 'increase':
                indexToFocus = activeIndex !== null ? activeIndex + 1 : 0;
                break;
            case 'decrease':
                indexToFocus = activeIndex !== null ? activeIndex - 1 : 0;
                break;
            default: return;
        }

        if (indexToFocus > nodes.length - 1) {
            indexToFocus = 0;
        }
        if (indexToFocus < 0) {
            indexToFocus = nodes.length - 1;
        }

        setActiveIndex(indexToFocus);
    }, [activeIndex]);

    const keyDownListener = useCallback(e => {
        if (e.shiftKey) shiftPressed = true;

        const backArrows = useArrows && (e.keyCode === leftArrow || e.keyCode === upArrow);
        const forwardArrows = useArrows && (e.keyCode === rightArrow || e.keyCode === downArrow);
        const tabPressed = e.keyCode === tab;
        const shiftTabPressed = e.keyCode === tab && shiftPressed;

        //  go back
        if (backArrows || shiftTabPressed) {
            e.preventDefault();
            changeActiveIndex('decrease');
            return;
        }

        //  go forward
        if (forwardArrows || tabPressed) {
            e.preventDefault();
            changeActiveIndex('increase');
        }
    }, [nodes, activeIndex]);

    const keyUpListener = useCallback(e => {
        if (e.shiftKey) shiftPressed = false;
    }, []);

    const focusListener = useCallback(e => {
        const node = e.currentTarget;
        const nodeIndex = nodes.indexOf(node);

        if (nodeIndex > -1) {
            setActiveIndex(nodeIndex);
        }
    }, [nodes, activeIndex]);

    const perform = useCallback(action => {
        nodes.forEach(node => {
            node[action]('keydown', keyDownListener);
            node[action]('keyup', keyUpListener);
            node[action]('focus', focusListener);
        });
    }, [nodes, activeIndex]);


    useEffect(() => {
        if (rootNode) {
            updateNodes(rootNode);
        }
    }, [rootNode]);

    useEffect(() => {
        perform('addEventListener');
        return () => perform('removeEventListener');
    }, [nodes, activeIndex]);

    useEffect(() => {
        if (nodes.length) {
            if (nodes[activeIndex]) {
                nodes[activeIndex].focus();
            } else {
                console.error('Focus failed. Node does not exist');
            }
        }
    }, [activeIndex]);

    return getRootRef;
};

export default useTabIndexGroup;
