import { EntityBase } from "./entity-base";
import { Project } from "./project";
import { UserClaim } from "./user-claim";
import { UserElementCell } from "./user-element-cell";
import { UserElementField } from "./user-element-field";
import { UserLogin } from "./user-login";
import { UserRole } from "./user-role";
import { Token } from "./token";
import { stripInvalidChars } from "../utils";

export class User extends EntityBase {

  // Server-side
  Id = 0;
  Email = "";
  EmailConfirmed = false;
  EmailConfirmationSentOn: Date | null = null;
  FirstName: string = null;
  MiddleName: string = null;
  LastName: string = null;
  SingleUseToken: string = null;
  HasPassword = false;
  PhoneNumber = "";
  PhoneNumberConfirmed = false;
  TwoFactorEnabled = false;
  AccessFailedCount = 0;
  LockoutEnabled = false;
  LockoutEndDateUtc: Date | null = null;
  Notes = "";
  Claims: UserClaim[];
  Logins: UserLogin[];
  Roles: UserRole[];
  ProjectSet: Project[];
  UserElementFieldSet: UserElementField[];
  UserElementCellSet: UserElementCell[];

  // Client-side
  token: Token = null;

  get UserName(): string {
    return this.fields.userName;
  }
  set UserName(value: string) {
    this.fields.userName = stripInvalidChars(value);
  }

  get userText() {

    if (!this.initialized) {
      return "";
    }

    let userText = this.UserName;

    if (this.Roles.length > 0) {
      userText += ` (${this.Roles[0].Role.Name})`;
    }

    return userText;
  }

  private fields: {
    userName: string,
  } = {
    userName: "",
  };

  isAuthenticated() {
    return this.Id > 0;
  }

  isAdmin() {

    if (!this.initialized) {
      return false;
    }

    return this.Roles[0].Role.Name === "Administrator";
  }
}
