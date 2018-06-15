/* global $ */
'use strict';

const api = (function () {
  const search = function (path, query) {
    return $.ajax({
      type: 'GET',
      url: path,
      headers: { 'Authorization': `Bearer ${store.authToken}`},
      dataType: 'json',
      data: query
    });
  };
  const details = function (path) {
    return $.ajax({
      type: 'GET',
      dataType: 'json',
      url: path,
      headers: { 'Authorization': `Bearer ${store.authToken}`},
    });
  };
  const update = function (path, obj) {
    return $.ajax({
      type: 'PUT',
      url: path,
      headers: { 'Authorization': `Bearer ${store.authToken}`},
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify(obj)
    });
  };
  const create = function (path, obj) {
    return $.ajax({
      type: 'POST',
      url: path,
      headers: { 'Authorization': `Bearer ${store.authToken}`},
      contentType: 'application/json',
      dataType: 'json',
      processData: false,
      data: JSON.stringify(obj)
    });
  };
  const remove = function (path) {
    return $.ajax({
      type: 'DELETE',
      dataType: 'json',
      url: path,
      headers: { 'Authorization': `Bearer ${store.authToken}`},
    });
  };
  return {
    create,
    search,
    details,
    update,
    remove
  };
}());