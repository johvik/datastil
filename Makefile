all:
	@cd client && grunt
	@cd server && grunt

travis:
	@echo "exports.USER = 'travis';\nexports.PASSWORD = '';\nexports.DB = 'testdb';\nexports.PORT = 9002" > server/testconfig.js
	@cd client && grunt release
	@cd server && grunt release

