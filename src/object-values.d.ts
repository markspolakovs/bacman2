declare module "object-values" {
    function values<T>(o: { [K: string]: T }): T[];
    export default values;
}