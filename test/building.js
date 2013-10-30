var assert = require('assert')
, path     = require('path')
, fs       = require('fs')
, fse      = require('fs-extra')

var parse = require('../lib/parsing.js')
, build   = require('../lib/building.js')
, helpers = require('../lib/helpers.js')

describe('building.js', function () {
    var globalConfig = parse.parseGlobalConfig()
    , config         = build.parseConfig('test/test-sites/valid-site')
    , assetsDir      = path.join(config.sitePath, globalConfig.assets.input)

	describe('#parseConfig()', function () {
        it('should return an object', function () {
            assert(config instanceof Object)
        })
        it('should add a `sitePath` property', function () {
            assert(config.sitePath)
        })
        it('should throw an error when no config.yml file is found', function () {
            assert.throws(function () { build.parseConfig('test/test-sites/errors/no-config') }, /No config.yml file/)
        })
    })

	describe('#prepareOutputDir()', function () {
        var outputDir  = path.join(config.sitePath, config.buildDir)
        , assetsDir    = path.join(config.sitePath, globalConfig.assets.input)
        , assetsOutput = path.join(outputDir, 'assets')

        it('should recreate the buildDir if already present', function (done) {
            before(function (done) {
                if (fs.existsSync(outputDir)) {
                    fse.remove(outputDir, function (err) {
                        assert.ifError(err)
                        done()
                    })
                }
            })

            build.prepareOutputDir(outputDir, assetsDir, assetsOutput, function (err) {
                assert.ifError(err)
                assert(fs.existsSync(outputDir), 'buildDir has not been created')
                done()
            })
        })
		it('should initialize a buildDir directory containing the required folders', function (done) {
			build.prepareOutputDir(outputDir, assetsDir, assetsOutput, function (err) {
				assert.ifError(err)
                assert(fs.existsSync(path.join(assetsOutput, 'js')), 'No assets/js folder')
                assert(fs.existsSync(path.join(assetsOutput, 'img')), 'No assets/img folder')
                assert(fs.existsSync(path.join(assetsOutput, 'files')), 'No assets/files folder')
				done()
			})
		})

		after(function (done) {
			fse.remove(outputDir, function (err) {
                assert.ifError(err)
				done()
			})
		})
	})

	describe('#fetchBlogPosts()', function () {
        var posts

        beforeEach(function () {
        	posts = build.fetchBlogPosts(config.sitePath)
        })

        it('should return an Array', function () {
            assert(posts instanceof Array)
        })
        it('should return an Array with blog posts containing all required properties', function () {
            for (var i = posts.length - 1; i >= 0; i--) {
                assert(posts[i].toJade.date)
                assert(posts[i].toJade.title)
                assert(posts[i].toJade.content)
                assert(posts[i].toJade.author)
                assert(posts[i].toJade.link)
            }  
        })
        it('should return as much blogs posts than there are files', function (done) {
            helpers.getFiles(path.join(config.sitePath, globalConfig.posts.input), new RegExp(/\.md$/), function (err, items) {
                assert.ifError(err)
                assert(posts.length == items.length)
                done()
            })
        })
    })

    describe('#compileStylesheets()', function () {
        this.slow(500)
        var stylPath = path.join(config.sitePath, globalConfig.templateDir)
        , outputCss  = path.join(config.sitePath, 'rendering-css')

        beforeEach(function (done) {
            fse.remove(outputCss, function (err) {
                assert.ifError(err)
                done()
            })
        })

        it('should create outputCss folder if not existing', function (done) {
            build.compileStylesheets(stylPath, outputCss, function (err) {
                assert.ifError(err)
                assert(fs.existsSync(outputCss), 'outputCss directory was not created')
                done()
            })
        })
        it('should compile all Stylus files from template to outputCss', function (done) {
            build.compileStylesheets(stylPath, outputCss, function (err) {
                assert.ifError(err)
                helpers.getFiles(stylPath, new RegExp(/\.styl$/), function (err, items) {
                    assert.ifError(err)
                    items.forEach(function (item, idx) {
                        var cssFile = path.join(outputCss, path.basename(item).replace(/\.styl$/, '.css'))
                        assert(fs.existsSync(cssFile), 'Inexistant css file: ' + cssFile + ' for file: ' + item)
                        if (idx == items.length - 1) done()
                    })
                })
            })
        })

        afterEach(function (done) {
            fse.remove(outputCss, function (err) {
                assert.ifError(err)
                done()
            })
        })
    })

    describe('#buildSite()', function () {

    })
})