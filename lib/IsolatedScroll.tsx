import * as React from 'react';
import { isTruthyWithDefault } from './utils';

interface Props {
    // callbacks
    atTop?: (delta: number) => void;
    atBottom?: (delta: number) => void;
    // configuration
    atTopMargin?: number;
    atBottomMargin?: number;
    // controls
    enabled?: boolean;
    preventScroll?: boolean;
    topScroll?: number;
}
const ownProps = [
    'atTop', 'atBottom', 'enabled', 'atBottomMargin',
    'atTopMargin', 'topScroll', 'preventScroll'
];

// This component allow to prevent scroll events to bubble to parent divs
//  it also expose callback props to handy event like "atTop" or "atBottom"
export class IsolatedScroll extends React.Component<Props & React.HTMLAttributes<{}>, {}> {

    containerEl: HTMLElement | null;
    touchStart: number;

    componentDidUpdate(prevProps: Props) {
        const { topScroll } = this.props;

        if (this.containerEl) {
            if (
                topScroll && topScroll !== this.containerEl.clientHeight
            ) {
                const scrollValue = topScroll === Number.POSITIVE_INFINITY ?
                    this.containerEl.clientHeight :
                    topScroll === Number.NEGATIVE_INFINITY ?
                        0 :
                        topScroll;
                this.containerEl.scrollTo({ top: scrollValue, left: 0, behavior: 'smooth' });
            }
        }

        if (prevProps.enabled !== this.props.enabled) {
            this.setUpListeners(isTruthyWithDefault(this.props.enabled, false));
        }
    }

    get triggerMargins() {
        const { atTopMargin, atBottomMargin } = this.props;
        return {
            top: atTopMargin || 150,
            bottom: atBottomMargin || 150
        };
    }

    setContainerElement = (element: HTMLElement | null) => {
        if (element && !this.containerEl) {
            this.containerEl = element;
            if (isTruthyWithDefault(this.props.enabled, true)) {
                this.setUpListeners(true);
            }
        }
    }

    setUpListeners(shouldListen: boolean = true) {
        if (shouldListen) {
            this.containerEl!.addEventListener('touchstart', this.onTouchStartHandler.bind(this));
            this.containerEl!.addEventListener('touchmove', this.onTouchMoveHandler.bind(this));
            this.containerEl!.addEventListener('wheel', this.onWheelHandler.bind(this));
        } else {
            this.containerEl!.removeEventListener('touchstart', this.onTouchStartHandler.bind(this));
            this.containerEl!.removeEventListener('touchmove', this.onTouchMoveHandler.bind(this));
            this.containerEl!.removeEventListener('wheel', this.onWheelHandler.bind(this));
        }
    }

    componentWillUnmount() {
        if (isTruthyWithDefault(this.props.enabled, false) && this.containerEl) {
            this.setUpListeners(false);
        }
    }

    handleScroll = (e: Event, delta: number) => {
        const isDeltaPositive = delta > 0;
        if (this.containerEl && isTruthyWithDefault(this.props.enabled, false)) {
            if (isTruthyWithDefault(this.props.preventScroll, false)) {
                return this.cancelScrollEvent(e);
            } else {
                const { scrollTop, scrollHeight, clientHeight } = this.containerEl;
                const { top: topMargin, bottom: bottomMargin } = this.triggerMargins;
                if (isDeltaPositive && scrollHeight - clientHeight - scrollTop - bottomMargin <= 0) {
                    if (this.props.atBottom) {
                        this.props.atBottom(delta);
                    }
                    if (e && scrollHeight - clientHeight - scrollTop <= 0) {
                        this.containerEl.scrollTop = scrollHeight;
                        return this.cancelScrollEvent(e);
                    }
                } else if (scrollTop - topMargin <= 0 && !isDeltaPositive) {
                    if (this.props.atTop) {
                        this.props.atTop(delta);
                    }
                    if (e && scrollTop <= 0) {
                        this.containerEl.scrollTop = 0;
                        return this.cancelScrollEvent(e);
                    }
                }
            }
        }
    }

    onWheelHandler(e: WheelEvent) {
        this.handleScroll(e, e.deltaY);
    }

    onTouchStartHandler(e: TouchEvent) {
        this.touchStart = e.changedTouches[0].clientY;
    }

    onTouchMoveHandler(e: TouchEvent) {
        const delta = this.touchStart - e.changedTouches[0].clientY;
        this.handleScroll(e, delta);
    }

    cancelScrollEvent(e: Event) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return false;
    }

    get childProps() {
        return (
            (props) => {
                let hash = {};
                for (const key in props) {
                    if (props.hasOwnProperty(key) && !ownProps.includes(key)) {
                        hash[key] = props[key];
                    }
                }
                return hash;
            }
        )(this.props)
    }

    render() {
        return React.cloneElement(
            React.Children.only(this.props.children),
            {
                ref: this.setContainerElement,
                ...this.childProps
            }
        );
    }
}
