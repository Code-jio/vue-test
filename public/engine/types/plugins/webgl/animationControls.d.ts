import { BasePlugin } from "../basePlugin";
export declare class AnimationControls extends BasePlugin {
    private mixer;
    private action;
    private clip;
    private animationName;
    private localRoot;
    private duration;
    private tracks;
    private isPlaying;
    private clock;
    constructor(meta: any);
    nextFrame(): void;
    prevFrame(): void;
    reset(): void;
    pause(): void;
    play(options: Object | null): void;
    stop(): void;
    isRunning(): boolean;
    update(): void;
}
