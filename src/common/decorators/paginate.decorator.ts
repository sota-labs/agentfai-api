import { applyDecorators, BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export interface IPagination {
  page: number;
  limit: number;
}
export interface ISortPagination {
  page: number;
  limit: number;
  sortParam?: string;
  order?: 1 | -1;
}

export enum ESort {
  DESC = 'DESC',
  ASC = 'ASC',
}

function isIntNumberStringReg(str: string): boolean {
  return new RegExp(/^-?[0-9]+$/).test(str);
}

export const ApiPaginationQuery = () => {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      description: `Page number, default: ${DEFAULT_PAGE}`,
      type: Number,
    }),

    ApiQuery({
      name: 'limit',
      required: false,
      description: `Number items per page, default: ${DEFAULT_LIMIT}`,
      type: Number,
    }),
  );
};

const createPagination = (pageStr: string, limitStr: string): { page: number; limit: number } => {
  let page: number;
  let limit: number;

  if (pageStr === undefined || pageStr === null) {
    page = DEFAULT_PAGE;
  } else {
    if (!isIntNumberStringReg(pageStr)) {
      throw new BadRequestException('Page and limit must be an integer number.');
    }
    page = +pageStr;
  }

  if (limitStr === undefined || limitStr === null) {
    limit = DEFAULT_LIMIT;
  } else {
    if (!isIntNumberStringReg(limitStr)) {
      throw new BadRequestException('Page and limit must be an integer number.');
    }
    limit = +limitStr;
  }

  if (page < 0 || limit < 0) {
    throw new BadRequestException('Page and limit must be greater than 0.');
  }

  if (page == 0 || limit == 0) {
    throw new BadRequestException('Page and limit must not be less than 1.');
  }

  if (limit > 200) {
    throw new BadRequestException('Limit must not be greater than 200.');
  }

  return {
    page,
    limit,
  };
};

export const Pagination = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return createPagination(req.query.page, req.query.limit) as IPagination;
});

export const ApiSortPaginationQuery = () => {
  return applyDecorators(
    ApiPaginationQuery(),
    ApiQuery({
      name: 'sortParam',
      required: false,
      explode: false,
      description: `Field to sort`,
      example: 'createdAt',
      type: String,
    }),
    ApiQuery({
      name: 'order',
      required: false,
      description: `Order by sorted field`,
      example: ESort.DESC,
      type: String,
    }),
  );
};

const createSortPagination = (
  pageStr: string,
  limitStr: string,
  sortParam: string,
  orderStr: string,
): ISortPagination => {
  const { page, limit } = createPagination(pageStr, limitStr);
  let order: 1 | -1;

  if (orderStr === undefined || orderStr === null) {
    order = -1;
  } else {
    if (ESort[orderStr] === undefined) {
      throw new BadRequestException('Order must be DESC or ASC');
    }
    order = ESort[orderStr] === ESort.DESC ? -1 : 1;
  }

  return {
    page,
    limit,
    sortParam,
    order,
  };
};

export const SortPagination = createParamDecorator((validParams, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  if (typeof validParams != 'object' || (req.query.sortParam && !validParams.includes(req.query.sortParam)))
    throw new BadRequestException('Invalid sort parameter');
  if (!req.query.sortParam) req.query.sortParam = '_id';
  return createSortPagination(req.query.page, req.query.limit, req.query.sortParam, req.query.order);
});
