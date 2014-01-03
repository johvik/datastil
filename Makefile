all:
	@cd client && grunt
	@cd server && grunt

travis:
	@echo "exports.USER = 'travis';\n\
	exports.PASSWORD = '';\n\
	exports.DB = 'testdb';\n\
	exports.PORT = 9002;" > server/config_test.js
	@cd client && grunt release
	@cd server && grunt release

