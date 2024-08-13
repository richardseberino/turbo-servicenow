class TurbonomicChangeRequest {

    public type = 'TurbonomicChangeRequest';
    private id = '';
    private number = '';
    private state = '';

    constructor() {
    }

    public getId(): string {
        return this.id;
    }

    public setId(id: string) {
        this.id = id;
    }

    public getNumber(): string {
        return this.number;
    }

    public setNumber(number: string) {
        this.number = number;
    }

    public getState(): string {
        return this.state;
    }

    public setState(state: string) {
        this.state = state;
    }

}
