import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AppEntityManager, AppHttpClient, AuthService, User, Project } from "@forcrowd/backbone-client-core";
import { EntityQuery, Predicate } from "breeze-client";
import { Observable } from "rxjs";
import { finalize, mergeMap, map } from "rxjs/operators";

import { settings } from "../../settings/settings";

@Injectable()
export class AdminService {

  get currentUser(): User {
    return this.authService.currentUser;
  }

  get isBusy(): boolean {
    return this.appEntityManager.isBusy || this.appHttpClient.isBusy || this.isBusyLocal;
  }
  private readonly appHttpClient: AppHttpClient = null;
  private isBusyLocal: boolean = false; // Use this flag for functions that contain multiple http requests (e.g. saveChanges())

  constructor(private appEntityManager: AppEntityManager,
    private authService: AuthService,
    private httpClient: HttpClient) {

    this.appHttpClient = httpClient as AppHttpClient;
  }

  getProjectSet(onlyCount = false, forceRefresh = false) {

    let query = EntityQuery.from("Project");

    if (onlyCount) {
      query = query.take(0).inlineCount(true);
    } else {
      query = query.expand(["User"])
        .orderByDesc("ModifiedOn");
    }

    return this.appEntityManager.executeQueryObservable<Project>(query, forceRefresh);
  }

  getUser() {
    let query = EntityQuery
      .from("Users")
      .inlineCount(true)
      .orderByDesc("CreatedOn");

    return this.appEntityManager.executeQueryObservable<User>(query).pipe(
      map((response) => {
        return response;
      }));
  }

  getProject() {
    let query = EntityQuery
      .from("Project")
      .inlineCount(true)
      .orderByDesc("CreatedOn");

    return this.appEntityManager.executeQueryObservable<Project>(query).pipe(
      map((response) => {
        return response;
      }));
  }

  saveChanges(): Observable<void> {
    this.isBusyLocal = true;

    return this.authService.ensureAuthenticatedUser().pipe(
      mergeMap(() => {
        return this.appEntityManager.saveChangesObservable();
      }),
      finalize(() => {
        this.isBusyLocal = false;
      }),);
  }

  updateComputedFields(project: Project): Observable<void> {

    const url = `${settings.serviceApiUrl}/ProjectApi/${project.Id}/UpdateComputedFields`;

    return this.httpClient.post<void>(url, null);
  }
}
