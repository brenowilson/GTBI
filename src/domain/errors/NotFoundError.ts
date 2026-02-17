export class NotFoundError extends Error {
  public readonly entity: string;
  public readonly id?: string;

  constructor(entity: string, id?: string) {
    super(id ? `${entity} with id ${id} not found` : `${entity} not found`);
    this.name = "NotFoundError";
    this.entity = entity;
    this.id = id;
  }
}
