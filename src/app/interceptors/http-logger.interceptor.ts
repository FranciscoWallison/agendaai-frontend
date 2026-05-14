import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable()
export class HttpLoggerInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const started = Date.now();
    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            const ms = Date.now() - started;
            console.log(
              `[HTTP] ${req.method} ${req.urlWithParams} -> ${event.status} (${ms}ms)`,
            );
          }
        },
        error: (err: unknown) => {
          const ms = Date.now() - started;
          if (err instanceof HttpErrorResponse) {
            console.error(
              `[HTTP] ${req.method} ${req.urlWithParams} -> ${err.status} ${err.statusText} (${ms}ms)`,
              err.error,
            );
          } else {
            console.error(
              `[HTTP] ${req.method} ${req.urlWithParams} -> network error (${ms}ms)`,
              err,
            );
          }
        },
      }),
    );
  }
}
