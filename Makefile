all: test

test-travis:
	@echo "exports.USER = 'travis';\nexports.PASSWORD = '';" > server/config.js
	@$(MAKE) -s test

test:
	@$(MAKE) -s lint

lint:
	@./node_modules/.bin/jshint ./server/lib ./index.js
