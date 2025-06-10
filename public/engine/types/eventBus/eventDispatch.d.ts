export interface BaseEvent {
    type: string;
}
export interface Event extends BaseEvent {
    target?: any;
    [attachment: string]: any;
}
export interface EventListener<E extends BaseEvent = Event> {
    (event: E): void;
}
export declare class EventDispatcher {
    listeners: Map<string, Array<Function>>;
    constructor();
    /**
     * 订阅一个事件
     * @param type 事件类型
     * @param listener 触发该类型时的执行函数
     * @returns
     */
    addEventListener<C extends BaseEvent>(type: string, listener: EventListener<C>): void;
    /**
     * 判断该事件类型下是否有相关方法
     * @param type 事件类型
     * @param listener 事件方法
     * @returns true or false
     */
    hasEventListener<C extends BaseEvent>(type: string, listener: EventListener<C>): boolean;
    /**
     * 移除事件(包括该事件对应的节流事件和防抖事件)
     * @param type 事件类型
     * @param listener 事件方法
     * @returns
     */
    removeEventListener<C extends BaseEvent>(type: string, listener: EventListener<C>): void;
    /**
     * 移除该类型的所有事件
     * @param type 事件类型
     * @returns
     */
    removeEvent(type: string): void;
    /**
     * 触发事件
     * @param event
     * event.type 必传，为需要触发的事件类型
     * event.xxx 为其他需要传入的数据
     * @returns
     */
    dispatchEvent<C extends BaseEvent>(event: C): void;
    /**
     * 一次性事件触发，触发一次之后会自动被移除
     * @param type 事件类型
     * @param listener 事件方法
     */
    once<C extends BaseEvent>(type: string, listener: EventListener<C>): void;
    /**
     * 触发事件
     * @param name 事件类型
     * @param params 其他的事件参数
     */
    emit<C extends BaseEvent>(name: C["type"], params?: Omit<C, "type">): void;
    /**
     * 订阅事件
     * @param type 事件类型
     * @param listener 事件方法
     */
    on<C extends BaseEvent>(type: C["type"], listener: EventListener<C>): void;
    /**
     * 判断该事件类型下是否有此事件
     * @param type 事件类型
     * @param listener 事件方法
     * @returns
     */
    has<C extends BaseEvent>(type: C["type"], listener: EventListener<C>): boolean;
    /**
     * 移除事件，如果不传listener就会移除整个type事件类型下的事件
     * @param type 事件类型
     * @param listener 事件方法
     * @returns
     */
    off<C extends BaseEvent>(type: C["type"], listener?: EventListener<C>): void;
    /**
     * 获取该事件类型下的事件数量
     * @param type 事件类型
     * @returns 数量
     */
    eventCount(type: string): number;
    /**
     * 销毁该类型的最后一个事件
     * @param type 事件类型
     * @returns
     */
    popLatestEvent(type: string): void;
    /**
     * 清空所有事件类型的事件
     */
    clear(): void;
}
