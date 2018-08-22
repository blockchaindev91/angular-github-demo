import { Injectable } from '@angular/core';
import Axios from "axios";
import { BehaviorSubject } from "rxjs";

import * as config from "../../config/config.json";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private _isLoginSubject = new BehaviorSubject(false);
  private _accessToken = null;

  constructor() {
    this.checkLogin();
  }

  getParamsFromUrl(url) {
    var query = url.substring(1);
    var result = {};
    query.split("&").forEach(function(part) {
      var item = part.split("=");
      result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
  }

  async getAccessToken(url: string)  {
    const params = this.getParamsFromUrl(url);
    const stateStore = window.sessionStorage.getItem('state');
    if (params["state"] != stateStore) {
      return;
    }
    window.sessionStorage.removeItem('state');
    const body = `client_id=${this.clientId()}&client_secret=${this.clientSecret()}&code=${params['code']}`;
    let res = await Axios.post("https://github.com/login/oauth/access_token",body);
    if (res.status !== 200 || !res.data) {
      return;
    }
    const responseParams = this.getParamsFromUrl('?' + res.data);
    const accessToken = responseParams['access_token'];
    this.setAccessToken(accessToken);
    this._isLoginSubject.next(true);
  }
  clientId() {
    return config.github_client_id;
  }
  clientSecret() {
    return config.github_secret;
  }

  getState() {
    return Math.random().toString(36).substring(2);
  }

  setAccessToken(accessToken: string) {
    this._accessToken = accessToken;
    window.localStorage.setItem('accessToken', accessToken);
  }

  accessToken() {
    this._accessToken = this._accessToken || window.localStorage.getItem('accessToken');
    return this._accessToken;
  }

  isLoginSubject() {
    return this._isLoginSubject;
  }

  authorizeGithub() {
    const state = this.getState();
    window.sessionStorage.setItem('state', state);
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${this.clientId()}&state=${state}&scope=user,public_repo`;
  }

  logout() {
    window.localStorage.removeItem('accessToken');
    this._accessToken = null;
    this._isLoginSubject.next(false);
  }

  checkLogin() {
    this._isLoginSubject.next(this.accessToken() != null);
  }
}
