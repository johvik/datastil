all:
	@cd client && grunt
	@cd server && grunt

travis:
	@echo "exports.USER = 'travis';\nexports.PASSWORD = '';" > server/config.js
	@cd client && grunt release
	@cd server && grunt release

