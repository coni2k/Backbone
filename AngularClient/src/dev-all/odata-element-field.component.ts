import { Component } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { mergeMap, map } from "rxjs/operators";
import { Element, Project, User, AuthService, getUniqueValue } from "@forcrowd/backbone-client-core";

import { settings } from "../settings/settings";

@Component({
  selector: "odata-element-field",
  templateUrl: "odata-element-field.component.html"
})
export class ODataElementFieldComponent {

  get anotherUserId(): number {
    return 2;
  }
  get currentUser(): User {
    return this.authService.currentUser;
  }
  get invalidUserId(): number {
    return -1;
  }

  constructor(
    private authService: AuthService,
    private httpClient: HttpClient) {
  }

  createAnother(): void {
    this.create(this.anotherUserId).subscribe(this.handleResponse);
  }

  createOwn(): void {
    this.create(this.currentUser.Id).subscribe(this.handleResponse);
  }

  deleteAnother(): void {
    this.delete(this.anotherUserId).subscribe(this.handleResponse);
  }

  deleteNotFound(): void {
    const url = this.getODataUrl(this.invalidUserId);
    this.httpClient.delete(url).subscribe(this.handleResponse);
  }

  deleteOwn(): void {
    this.delete(this.currentUser.Id).subscribe(this.handleResponse);
  }

  updateAnother(): void {
    this.update(this.anotherUserId).subscribe(this.handleResponse);
  }

  updateNotFound(): void {
    const url = this.getODataUrl(this.invalidUserId);
    this.httpClient.patch(url, {}).subscribe(this.handleResponse);
  }

  updateOwn(): void {
    this.update(this.currentUser.Id).subscribe(this.handleResponse);
  }

  private create(userId: number): Observable<any> {

    return this.getElement(userId).pipe(mergeMap((element) => {

      var elementField = {
        ElementId: element.Id,
        Name: `New field ${getUniqueValue()}`
      };

      const url = `${settings.serviceODataUrl}/ElementField`;

      return this.httpClient.post(url, elementField);
    }));
  }

  private delete(userId: number): Observable<any> {

    return this.getElement(userId, true).pipe(mergeMap((element) => {

      var elementField = element.ElementFieldSet[0];

      const url = this.getODataUrl(elementField.Id);

      return this.httpClient.delete(url);
    }));
  }

  private getODataUrl(elementFieldId: number) {
    return `${settings.serviceODataUrl}/ElementField(${elementFieldId})`;
  }

  private getElement(userId: number, checkHasElementField: boolean = false): Observable<Element> {

    const url = `${settings.serviceODataUrl}/Project?$expand=ElementSet/ElementFieldSet&$filter=UserId eq ${userId}`;

    return this.httpClient.get(url).pipe(
      map((response) => {

        var results = (response as any).value as Project[];

        var project = results[0];

        if (!project) {
          throw new Error(`Create a new project first - user: ${userId}`);
        }

        var element = project.ElementSet[0];

        if (!element) {
          throw new Error(`Create a new element first - user: ${userId} - project: ${project.Id}`);
        }

        if (checkHasElementField && !element.ElementFieldSet[0]) {
          throw new Error(`Create a new field first - user: ${userId} - project: ${project.Id} - element: ${element.Id}`);
        }

        return element;
      }));
  }

  private handleResponse(response) {
    console.log("response", response);
  }

  private update(userId: number): Observable<any> {

    return this.getElement(userId, true).pipe(mergeMap((element) => {

      var elementField = element.ElementFieldSet[0];

      var body = {
        Name: `Updated field ${getUniqueValue()}`,
        RowVersion: elementField.RowVersion
      };

      const url = this.getODataUrl(elementField.Id);

      return this.httpClient.patch(url, body);
    }));
  }
}
