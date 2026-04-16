// 领域异常
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}

export class InvalidStateTransitionException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateTransitionException';
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entityType: string, id: string) {
    super(`${entityType} with id ${id} not found`);
    this.name = 'EntityNotFoundException';
  }
}
