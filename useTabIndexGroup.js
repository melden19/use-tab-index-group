import { useState, useEffect, useCallback } from 'react';

const leftArrow = 37;
const upArrow = 38;
const rightArrow = 39;
const downArrow = 40;
const tab = 9;

const useTabIndexGroup = (options = {}) => {
    const { autoFocus, useArrows } = options;

    const [nodes, setNodes] = useState([]);
    const [activeIndex, setActiveIndex] = useState(null);
    const [rootNode, setRootNode] = useState(null);

    const getRootRef = node => setRootNode(node);

    const updateNodes = useCallback(rootNode => {
        const selectedNodes = Array.from(rootNode.querySelectorAll('[tabindex]:not([tabindex=""])'))
            .filter(node => node.getAttribute('tabindex') > 0);

        // console.log('selectedNodes', selectedNodes);

        if (selectedNodes && selectedNodes.length) {
            const sortedNodes = selectedNodes.sort((a, b) => {
                const aIndex = a.getAttribute('tabindex');
                const bIndex = b.getAttribute('tabindex');
                if (aIndex < bIndex) return -1;
                if (aIndex > bIndex) return 1;
                return 0;
            });

            if (autoFocus) {
                setTimeout(sortedNodes[0].focus(), 0);
                setActiveIndex(0);
            }

            setNodes(sortedNodes);
        }
    }, [nodes]);

    const changeActiveIndex = useCallback(action => {
        let indexToFocus;
        switch (action) {
            case 'increase':
                // console.log('increase');
                indexToFocus = activeIndex !== null ? activeIndex + 1 : 0;
                break;
            case 'decrease':
                // console.log('decrease');
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

    const listener = useCallback(e => {
        const backArrows = useArrows && (e.keyCode === leftArrow || e.keyCode === upArrow);
        const forwardArrows = useArrows && (e.keyCode === rightArrow || e.keyCode === downArrow);
        const tabPressed = e.keyCode === tab;

        //  go back
        if (backArrows) {
            e.preventDefault();
            changeActiveIndex('decrease');
        }

        //  go forward
        if (forwardArrows || tabPressed) {
            e.preventDefault();
            changeActiveIndex('increase');
        }
    }, [nodes, activeIndex]);

    const perform = useCallback(action => {
        nodes.forEach(node => {
            node[action]('keydown', listener);
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
