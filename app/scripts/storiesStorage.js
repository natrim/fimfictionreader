(function (angular) {
  'use strict';

  function Stories(storage, db, timeout, q) {
    this._storage = storage;
    this._db = db;
    this._timeout = timeout;
    this._q = q;
  }

  Stories.prototype._wrap = function (callback) {
    this._db.openStore('stories', function (db) {
      callback(db);
    });
  };

  Stories.prototype.count = function () {
    return this._db.openStore('stories', function (db) {
      return db.count();
    });
  };

  Stories.prototype.clear = function () {
    return this._db.openStore('stories', function (db) {
      return db.clear();
    });
  };

  Stories.prototype.getAll = function () {
    return this._db.openStore('stories', function (db) {
      return db.getAll();
    });
  };

  Stories.prototype.insert = function (story) {
    return this._db.openStore('stories', (function (db) {
      return db.insert(story).then(this._saveIndex.bind(this));
    }).bind(this));
  };

  Stories.prototype.upsert = function (story) {
    return this._db.openStore('stories', (function (db) {
      return db.upsert(story).then(this._saveIndex.bind(this));
    }).bind(this));
  };

  Stories.prototype.set = Stories.prototype.save = Stories.prototype.upsert;

  Stories.prototype.find = function (id) {
    return this._db.openStore('stories', function (db) {
      return db.find(id);
    });
  };

  Stories.prototype.get = Stories.prototype.find;

  Stories.prototype.findBy = function (index, key) {
    return this._db.openStore('stories', function (db) {
      return db.findBy(index, key);
    });
  };

  Stories.prototype._saveIndex = function () {
    var defer = this._q.defer();
    if (this._saver) {
      this._timeout.cancel(this._saver);
      this._saver = null;
    }

    this._saver = this._timeout((function () {
      this._saver = null;
      this._db.getAllKeys().then(function (result) {
        if (typeof this._storage.set === 'function') {
          this._storage.set({
            'stories': result
          }, defer.resolve.bind(defer, result.length));
        } else {
          this._storage.setItem('stories', JSON.stringify(result));
          defer.resolve(result.length);
        }
      });
    }).bind(this), 1000);

    return defer.promise;
  };

  Stories.prototype._loadIndex = function () {
    var defer = this._q.defer();
    if (typeof this._storage.get === 'function') {
      this._storage.get('stories', (function (items) {
        var data = items.stories || [];
        defer.resolve(data);
      }).bind(this));
    } else {
      var data = JSON.parse(this._storage.getItem('stories') || '[]');
      defer.resolve(data);
    }
    return defer.promise;
  };

  angular.module('fictionReader.storiesStorage', ['indexedDB'])
    .config(function ($indexedDBProvider) {
      $indexedDBProvider
        .connection('storiesStorage')
        .upgradeDatabase(1, function (event, db) {
          var objStore = db.createObjectStore('stories', {
            keyPath: 'id'
          });
          objStore.createIndex('name_idx', 'title', {
            unique: false
          });
        });
    })
    .factory('storiesStorage', ['$window', '$timeout', '$q', '$indexedDB', function ($window, $timeout, $q, $indexedDB, $fimfictionLoader) {
      var defer = $q.defer();

      var stories = new Stories($window.chrome.storage.sync, $indexedDB, $timeout, $q);

      stories.count().then(function (count) {
        //push test data if storage empty
        if (count <= 0) {
          stories._loadIndex().then(function (data) {
            //$fimfictionLoader.load(stories, data);

            defer.resolve(stories);
          });
        } else {
          defer.resolve(stories);
        }

        //push test data if storage empty
        //if (count() <= 0) {
        //  stories.push(265786); // Tea Withdrawal by ZOMG
        //  stories.push(290575); // The Shortest Challenge for the Throne to Date by Reykan
        //}
      });


      return defer.promise;
    }]);
})(angular);
