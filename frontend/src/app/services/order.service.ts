import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(public httpClient: HttpClient) { }

  getAll() {
    return this.httpClient.get('http://localhost:3000/orders')
  }
  getByUser(token) {
    return this.httpClient.get('http://localhost:3000/orders/user', {
      headers: {'authorization': token}
    })
  }
  insert(token, order): Observable<any> {
    return this.httpClient.post('http://localhost:3000/orders', order, {
      headers: { authorization: token }
    });
}
