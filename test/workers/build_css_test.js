// @format
var expect = require('expect.js');
var BuildCss = require('../../src/workers/BuildCss.js');
var CachedCss = require('../../src/models/CachedCss.js');
var redis = require('redis-mock');
var simple = require('simple-mock');

describe('BuildCss', function() {
  before(function() {
    this.client = redis.createClient();
    this.generator = {generate: simple.stub().callbackWith(null, 'content')};
    this.subject = new BuildCss(this.generator, this.client);
    this.data = {page: {url: '/path', css: '/css', key: '123'}, config: {o: 1}};
  });

  describe('#perform', function() {
    it('calls generate', function(done) {
      var that = this;

      this.subject.perform(that.data).then(function() {
        expect(that.generator.generate.lastCall.args[0]).to.eql('/path');
        expect(that.generator.generate.lastCall.args[1]).to.eql('/css');
        expect(that.generator.generate.lastCall.args[2]).to.be(
          that.data.config,
        );
        done();
      });
    });

    it('persists the results to a model', function(done) {
      var item = new CachedCss(this.client, this.data.page);

      this.subject.perform(this.data).then(function() {
        item.load().then(function() {
          expect(item.attributes.status).to.eql('done');
          expect(item.attributes.content).to.eql('content');
          done();
        });
      });
    });
  });
});
