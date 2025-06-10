export interface WebGLParams {
    [key: string]: any;
}
export declare function validateShader(source: string): boolean;
export declare const validateGLParams: (params: WebGLParams) => boolean;
