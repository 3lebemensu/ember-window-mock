import window from 'ember-window-mock';
import { reset, setupWindowMock } from 'ember-window-mock/test-support';
import QUnit, { module, test } from 'qunit';
import sinon from 'sinon';
import $ from 'jquery';
import { dependencySatisfies } from '@embroider/macros';

module('window-mock', function (hooks) {
  setupWindowMock(hooks);

  module('general properties', function () {
    test('it proxies properties', function (assert) {
      window.window_mock_test_property = 'foo';
      assert.strictEqual(window.window_mock_test_property, 'foo');
      delete window.window_mock_test_property;
    });

    test('it proxies functions', function (assert) {
      assert.expect(1);
      window.focus();
      assert.ok(true);
    });

    test('it allows adding and deleting properties', function (assert) {
      window.testKey = 'test value';
      assert.ok('testKey' in window);
      delete window.testKey;
      assert.notOk('testKey' in window);
    });

    test('it allows adding and deleting functions', function (assert) {
      assert.expect(3);
      window.testFn = () => assert.ok(true);
      assert.ok('testFn' in window);
      window.testFn();
      delete window.testFn;
      assert.notOk('testFn' in window);
    });

    test('method calls have the correct context', function (assert) {
      assert.expect(1);
      window.testFn = function () {
        assert.strictEqual(this, window);
      };
      window.testFn();
    });

    test('it allows retrieving sinon functions from the proxy', function (assert) {
      assert.expect(1);
      window.testFn = sinon.spy();
      assert.strictEqual(window.testFn.callCount, 0);
    });

    test('it can call dispatchEvent', function (assert) {
      assert.expect(1);
      let spy = sinon.spy();
      window.addEventListener('test-event', spy);
      window.dispatchEvent(new Event('test-event'));
      assert.ok(spy.calledOnce);
    });

    test('it proxies various null fields', function (assert) {
      // NOTE: in some conditions these can be set by the navigator
      assert.strictEqual(window.frameElement, null);
      assert.strictEqual(window.opener, null);
      assert.strictEqual(window.onbeforeunload, null);
    });
  });

  module('window.location', function () {
    test('it defaults to window.location', function (assert) {
      assert.strictEqual(window.location.href, window.location.href);
    });

    test('it mocks window.location.href', function (assert) {
      window.location.href = 'http://www.example.com:8080/foo?q=bar#hash';
      assert.strictEqual(
        window.location.href,
        'http://www.example.com:8080/foo?q=bar#hash'
      );
      assert.strictEqual(window.location.host, 'www.example.com:8080');
      assert.strictEqual(window.location.hostname, 'www.example.com');
      assert.strictEqual(window.location.protocol, 'http:');
      assert.strictEqual(window.location.origin, 'http://www.example.com:8080');
      assert.strictEqual(window.location.port, '8080');
      assert.strictEqual(window.location.pathname, '/foo');
      assert.strictEqual(window.location.search, '?q=bar');
      assert.strictEqual(window.location.hash, '#hash');
    });

    test('window.location.href supports relative URLs', function (assert) {
      window.location.href = 'http://www.example.com:8080/foo?q=bar#hash';
      window.location.href = '/bar';
      assert.strictEqual(
        window.location.href,
        'http://www.example.com:8080/bar'
      );
      window.location.href = 'baz';
      assert.strictEqual(
        window.location.href,
        'http://www.example.com:8080/baz'
      );
      window.location.href = '/foo/bar';
      assert.strictEqual(
        window.location.href,
        'http://www.example.com:8080/foo/bar'
      );
      window.location.href = 'baz';
      assert.strictEqual(
        window.location.href,
        'http://www.example.com:8080/foo/baz'
      );
      window.location.href = '/foo/bar/';
      assert.strictEqual(
        window.location.href,
        'http://www.example.com:8080/foo/bar/'
      );
      window.location.href = 'baz';
      assert.strictEqual(
        window.location.href,
        'http://www.example.com:8080/foo/bar/baz'
      );
      window.location.href = '/';
      assert.strictEqual(window.location.href, 'http://www.example.com:8080/');
    });

    test('it mocks window.location', function (assert) {
      window.location = 'http://www.example.com';
      assert.strictEqual(window.location.href, 'http://www.example.com/');
    });

    test('it mocks window.location.reload', function (assert) {
      window.location.href = 'http://www.example.com';
      window.location.reload();
      assert.strictEqual(window.location.href, 'http://www.example.com/');
    });

    test('it mocks window.location.replace', function (assert) {
      window.location.href = 'http://www.example.com';
      window.location.replace('http://www.emberjs.com');
      assert.strictEqual(window.location.href, 'http://www.emberjs.com/');
    });

    test('it mocks window.location.assign', function (assert) {
      window.location.href = 'http://www.example.com';
      window.location.assign('http://www.emberjs.com');
      assert.strictEqual(window.location.href, 'http://www.emberjs.com/');
    });

    test('it mocks window.location.toString()', function (assert) {
      window.location.href = 'http://www.example.com';
      assert.strictEqual(window.location.toString(), 'http://www.example.com/');
    });

    test('it mocks pathname', function (assert) {
      window.location.href = 'http://www.example.com';
      window.location.pathname = '/foo/';
      assert.strictEqual(window.location.href, 'http://www.example.com/foo/');
    });
  });

  module('blocking dialogs', function () {
    test('it replaces alert with noop', function (assert) {
      assert.expect(1);
      assert.strictEqual(window.alert('foo'), undefined);
    });

    test('it replaces confirm with noop', function (assert) {
      assert.expect(1);
      assert.strictEqual(window.confirm('foo'), undefined);
    });

    test('it replaces prompt with prompt', function (assert) {
      assert.expect(1);
      assert.strictEqual(window.prompt('foo'), undefined);
    });

    test('it can stub alert', function (assert) {
      let stub = sinon.stub(window, 'alert');
      window.alert('foo');
      assert.ok(stub.calledOnce);
      assert.ok(stub.calledWith('foo'));
    });

    test('it can stub confirm', function (assert) {
      let stub = sinon.stub(window, 'confirm');
      stub.returns(true);
      let result = window.confirm('foo');
      assert.ok(stub.calledOnce);
      assert.ok(stub.calledWith('foo'));
      assert.true(result);
    });

    test('it can stub prompt', function (assert) {
      let stub = sinon.stub(window, 'prompt');
      stub.returns('bar');
      let result = window.prompt('foo');
      assert.ok(stub.calledOnce);
      assert.ok(stub.calledWith('foo'));
      assert.strictEqual(result, 'bar');
    });
  });

  module('localStorage', function () {
    test('it mocks window.localStorage.length', function (assert) {
      assert.strictEqual(window.localStorage.length, 0);

      window.localStorage.setItem('a', 'x');
      assert.strictEqual(window.localStorage.length, 1);

      window.localStorage.setItem('b', 'y');
      assert.strictEqual(window.localStorage.length, 2);

      window.localStorage.clear();
      assert.strictEqual(window.localStorage.length, 0);
    });

    test('it mocks window.localStorage.getItem', function (assert) {
      assert.strictEqual(window.localStorage.getItem('a'), null);

      window.localStorage.setItem('a', 'x');
      assert.strictEqual(window.localStorage.getItem('a'), 'x');

      window.localStorage.clear();
      assert.strictEqual(window.localStorage.getItem('a'), null);
    });

    test('it mocks window.localStorage.key', function (assert) {
      assert.strictEqual(window.localStorage.key(0), null);

      window.localStorage.setItem('a', 'x');
      assert.strictEqual(window.localStorage.key(0), 'a');

      window.localStorage.setItem('b', 'y');
      assert.strictEqual(window.localStorage.key(0), 'a');
      assert.strictEqual(window.localStorage.key(1), 'b');

      window.localStorage.clear();
      assert.strictEqual(window.localStorage.key(0), null);
    });

    test('it mocks window.localStorage.removeItem', function (assert) {
      window.localStorage.setItem('a', 'x');
      window.localStorage.setItem('b', 'y');
      assert.strictEqual(window.localStorage.getItem('a'), 'x');
      assert.strictEqual(window.localStorage.getItem('b'), 'y');

      window.localStorage.removeItem('a');
      assert.strictEqual(window.localStorage.getItem('a'), null);
      assert.strictEqual(window.localStorage.getItem('b'), 'y');

      window.localStorage.removeItem('y');
      assert.strictEqual(window.localStorage.getItem('b'), 'y');
    });

    test('it mocks window.localStorage.clear', function (assert) {
      window.localStorage.setItem('a', 'x');
      window.localStorage.setItem('b', 'y');

      assert.strictEqual(window.localStorage.length, 2);

      window.localStorage.clear();

      assert.strictEqual(window.localStorage.length, 0);
      assert.strictEqual(window.localStorage.getItem('a'), null);
      assert.strictEqual(window.localStorage.getItem('b'), null);
    });

    test('it clears localStorage on reset', function (assert) {
      window.localStorage.setItem('c', 'z');
      assert.strictEqual(window.localStorage.getItem('c'), 'z');
      assert.strictEqual(window.localStorage.key(0), 'c');
      assert.strictEqual(window.localStorage.length, 1);

      reset();

      assert.strictEqual(window.localStorage.getItem('c'), null);
      assert.strictEqual(window.localStorage.key(0), null);
      assert.strictEqual(window.localStorage.length, 0);
    });
  });

  module('sessionStorage', function () {
    test('it mocks window.sessionStorage.length', function (assert) {
      assert.strictEqual(window.sessionStorage.length, 0);

      window.sessionStorage.setItem('a', 'x');
      assert.strictEqual(window.sessionStorage.length, 1);
    });

    test('it mocks window.sessionStorage.getItem', function (assert) {
      assert.strictEqual(window.sessionStorage.getItem('a'), null);

      window.sessionStorage.setItem('a', 'x');
      assert.strictEqual(window.sessionStorage.getItem('a'), 'x');
    });

    test('it mocks window.sessionStorage.key', function (assert) {
      assert.strictEqual(window.sessionStorage.key(0), null);

      window.sessionStorage.setItem('a', 'x');
      assert.strictEqual(window.sessionStorage.key(0), 'a');
    });

    test('it mocks window.sessionStorage.removeItem', function (assert) {
      window.sessionStorage.setItem('a', 'x');

      window.sessionStorage.removeItem('a');
      assert.strictEqual(window.sessionStorage.getItem('a'), null);
    });

    test('it mocks window.sessionStorage.clear', function (assert) {
      window.sessionStorage.setItem('a', 'x');

      window.sessionStorage.clear();
      assert.strictEqual(window.sessionStorage.getItem('a'), null);
    });

    test('it clears sessionStorage on reset', function (assert) {
      window.sessionStorage.setItem('c', 'z');
      assert.strictEqual(window.sessionStorage.getItem('c'), 'z');
      assert.strictEqual(window.sessionStorage.key(0), 'c');
      assert.strictEqual(window.sessionStorage.length, 1);

      reset();

      assert.strictEqual(window.sessionStorage.getItem('c'), null);
      assert.strictEqual(window.sessionStorage.key(0), null);
      assert.strictEqual(window.sessionStorage.length, 0);
    });
  });

  module('window.navigator', function () {
    module('userAgent', function () {
      test('it works', function (assert) {
        let ua = navigator.userAgent; // not using window-mock
        assert.strictEqual(window.navigator.userAgent, ua);
      });

      test('it can be overridden', function (assert) {
        window.navigator.userAgent = 'mockUA';
        assert.strictEqual(window.navigator.userAgent, 'mockUA');
      });

      test('it can be resetted', function (assert) {
        let ua = window.navigator.userAgent;
        assert.notEqual(ua, 'mockUA');

        window.navigator.userAgent = 'mockUA';
        reset();
        assert.strictEqual(window.navigator.userAgent, ua);
      });
    });
  });

  module('window.screen', function () {
    test('it allows adding and deleting properties', function (assert) {
      window.screen.testKey = 'test value';
      assert.ok('testKey' in window.screen);
      delete window.screen.testKey;
      assert.notOk('testKey' in window.screen);
    });

    test('it allows adding and deleting functions', function (assert) {
      assert.expect(3);
      window.screen.testFn = () => assert.ok(true);
      assert.ok('testFn' in window.screen);
      window.screen.testFn();
      delete window.screen.testFn;
      assert.notOk('testFn' in window.screen);
    });

    module('width', function () {
      test('it works', function (assert) {
        let w = screen.width; // not using window-mock
        assert.strictEqual(window.screen.width, w);
      });

      test('it can be overridden', function (assert) {
        window.screen.width = 320;
        assert.strictEqual(window.screen.width, 320);
      });

      test('it can be resetted', function (assert) {
        let w = window.screen.width;
        assert.notEqual(w, 320);

        window.screen.width = 320;
        reset();
        assert.strictEqual(window.screen.width, w);
      });
    });
  });

  module('window.onerror', function (hooks) {
    let origOnerror;
    let origUnhandledRejection;
    let origQunitUncaught;

    hooks.beforeEach(function () {
      origOnerror = window.onerror;
      origUnhandledRejection = window.onunhandledrejection;
      origQunitUncaught = QUnit.onUncaughtException;
      QUnit.onUncaughtException = () => {};
    });

    hooks.afterEach(function () {
      window.onerror = origOnerror;
      window.onunhandledrejection = origUnhandledRejection;
      QUnit.onUncaughtException = origQunitUncaught;
    });

    test('onerror works as expected', function (assert) {
      const done = assert.async();
      assert.expect(1);
      window.onerror = sinon.spy();

      setTimeout(() => {
        throw new Error('error');
      }, 0);
      setTimeout(() => {
        assert.true(window.onerror.calledOnce, 'was called correctly');
        done();
      }, 10);
    });

    test('onunhandledrejection works as expected', function (assert) {
      const done = assert.async();
      assert.expect(1);

      QUnit.onUncaughtException = () => {};
      window.onunhandledrejection = sinon.spy();

      setTimeout(() => Promise.reject('rejected'), 0);
      setTimeout(() => {
        assert.true(
          window.onunhandledrejection.calledOnce,
          'was called correctly'
        );
        done();
      }, 10);
    });
  });

  module('nested proxies', function () {
    test('it allows adding and deleting properties', function (assert) {
      window.navigator.testKey = 'test value';
      assert.ok('testKey' in window.navigator);
      delete window.navigator.testKey;
      assert.notOk('testKey' in window.navigator);
    });

    test('it proxies functions', function (assert) {
      assert.expect(1);
      window.navigator.connection.removeEventListener('foo', () => {});
      assert.ok(true);
    });

    test('it allows adding and deleting functions', function (assert) {
      assert.expect(3);
      window.navigator.testFn = () => assert.ok(true);
      assert.ok('testFn' in window.navigator);
      window.navigator.testFn();
      delete window.navigator.testFn;
      assert.notOk('testFn' in window.navigator);
    });

    test('method calls have the correct context', function (assert) {
      assert.expect(1);
      window.navigator.testFn = function () {
        assert.strictEqual(this, window.navigator);
      };
      window.navigator.testFn();
    });

    test('static methods work', function (assert) {
      assert.strictEqual(typeof window.Notification, 'function');
      assert.strictEqual(
        typeof window.Notification.requestPermission,
        'function'
      );
    });

    test('it works', function (assert) {
      let t = screen.orientation.type; // not using window-mock
      assert.strictEqual(window.screen.orientation.type, t);
    });

    test('it can be overridden', function (assert) {
      window.screen.orientation.type = 'custom';
      assert.strictEqual(window.screen.orientation.type, 'custom');
    });

    test('it can be resetted', function (assert) {
      let t = window.screen.orientation.type;
      assert.notEqual(t, 'custom');

      window.screen.orientation.type = 'custom';
      reset();
      assert.strictEqual(window.screen.orientation.type, t);
    });

    test('it proxies nested null fields', function (assert) {
      assert.strictEqual(window.history.state, null);
    });
  });

  module('window.window', function () {
    test('it works', function (assert) {
      assert.true(
        // eslint-disable-next-line qunit/no-assert-logical-expression
        typeof window.window === 'object' && window.window != null,
        'it exists'
      );
      assert.strictEqual(window, window.window, 'it is the same');
    });
  });

  if (dependencySatisfies('ember-source', '>=3.28')) {
    module('jQuery', function () {
      test('it can listen to window events', function (assert) {
        /* eslint-disable ember/no-jquery */
        const spy = sinon.spy();
        $(window).on('click', spy);

        $(window).trigger('click');
        assert.true(spy.calledOnce, 'event was triggered and listener called');
      });
    });
  }
});
