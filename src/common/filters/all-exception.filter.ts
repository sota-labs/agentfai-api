import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = this.getStatus(exception);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error('Exception caught:', exception);
    }
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: this.getMessage(exception),
      error: this.getError(exception),
    });
  }

  private getMessage(exception: any) {
    if (!(exception instanceof HttpException)) {
      return ['Internal server error'];
    }
    const error = (exception.getResponse() as any)?.message;
    if (Array.isArray(error)) {
      return error;
    }
    return [error];
  }

  private getStatus(exception: any) {
    if (!(exception instanceof HttpException)) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
    return exception.getStatus();
  }

  private getError(exception: any) {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }
    return (exception.getResponse() as any)?.error;
  }
}
