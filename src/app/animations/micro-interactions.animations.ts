import {
    animate,
    AnimationTriggerMetadata,
    keyframes,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';

/** Spring-like curves (Framer Motion–style; CSS/animate easing). */
export const JB_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
export const JB_SPRING_GENTLE = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const JB_SPRING_SNAPPY = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
export const JB_EASE_OUT = 'cubic-bezier(0.4, 0, 0.2, 1)';

/** Panel / overlay enter–leave with spring settle. */
export const fadeSlideUp: AnimationTriggerMetadata = trigger('fadeSlideUp', [
    transition(':enter', [
        style({opacity: 0, transform: 'translateY(10px) scale(0.98)'}),
        animate(`320ms ${JB_SPRING}`, style({opacity: 1, transform: 'translateY(0) scale(1)'})),
    ]),
    transition(':leave', [
        animate(`200ms ${JB_EASE_OUT}`, style({opacity: 0, transform: 'translateY(6px) scale(0.99)'})),
    ]),
]);

/** Backdrop fade for floating panels. */
export const fadeBackdrop: AnimationTriggerMetadata = trigger('fadeBackdrop', [
    transition(':enter', [
        style({opacity: 0}),
        animate(`220ms ${JB_EASE_OUT}`, style({opacity: 1})),
    ]),
    transition(':leave', [
        animate(`180ms ${JB_EASE_OUT}`, style({opacity: 0})),
    ]),
]);

/** Expand/collapse for tree children and collapsible regions. */
export const expandCollapse: AnimationTriggerMetadata = trigger('expandCollapse', [
    transition(':enter', [
        style({height: 0, opacity: 0, overflow: 'hidden'}),
        animate(`280ms ${JB_SPRING_GENTLE}`, style({height: '*', opacity: 1})),
    ]),
    transition(':leave', [
        style({overflow: 'hidden'}),
        animate(`220ms ${JB_EASE_OUT}`, style({height: 0, opacity: 0})),
    ]),
]);

/** Validation pill / status success pulse. */
export const validationPulse: AnimationTriggerMetadata = trigger('validationPulse', [
    state('invalid', style({transform: 'scale(1)'})),
    state('valid', style({transform: 'scale(1)'})),
    transition('invalid => valid', [
        animate(`520ms ${JB_SPRING}`, keyframes([
            style({transform: 'scale(1)', offset: 0}),
            style({transform: 'scale(1.08)', offset: 0.4}),
            style({transform: 'scale(1)', offset: 1}),
        ])),
    ]),
    transition('valid => invalid', [
        animate(`280ms ${JB_EASE_OUT}`, keyframes([
            style({transform: 'scale(1)', offset: 0}),
            style({transform: 'scale(0.96)', offset: 0.35}),
            style({transform: 'scale(1)', offset: 1}),
        ])),
    ]),
]);

/** Copy button success flash. */
export const copySuccess: AnimationTriggerMetadata = trigger('copySuccess', [
    state('idle', style({transform: 'scale(1)'})),
    state('copied', style({transform: 'scale(1)'})),
    transition('idle => copied', [
        animate(`550ms ${JB_SPRING}`, keyframes([
            style({transform: 'scale(1)', offset: 0}),
            style({transform: 'scale(1.18)', offset: 0.3}),
            style({transform: 'scale(1)', offset: 1}),
        ])),
    ]),
]);

export const MICRO_INTERACTION_ANIMATIONS: AnimationTriggerMetadata[] = [
    fadeSlideUp,
    fadeBackdrop,
    expandCollapse,
    validationPulse,
    copySuccess,
];
