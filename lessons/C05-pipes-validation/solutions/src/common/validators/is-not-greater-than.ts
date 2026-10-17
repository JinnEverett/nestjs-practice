import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/** Field được gắn phải <= field `other` (chỉ kiểm khi cả hai có mặt). */
export function IsNotGreaterThan(other: string, options?: ValidationOptions): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isNotGreaterThan',
      target: target.constructor,
      propertyName: propertyName as string,
      constraints: [other],
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const otherValue = (args.object as Record<string, unknown>)[args.constraints[0] as string];
          if (typeof value !== 'number' || typeof otherValue !== 'number') return true;
          return value <= otherValue;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} không được lớn hơn ${args.constraints[0] as string}`;
        },
      },
    });
  };
}
