NAME = ft_transcendence
BACKEND = ./backend
FRONTEND = ./frontend

.PHONY: all
all: $(NAME)

$(NAME): build

.PHONY: build
build:
	docker-compose up --build

.PHONY: up
up:
		docker-compose up -d

.PHONY: down
down:
		docker-compose down

.PHONY: local
local: db setup

.PHONY: db
db:
		docker-compose up --build -d dev-postgres

.PHONY: db-up
db-up:
		docker-compose up -d dev-posegres

# NOTE: docker composeの一部のコンテナのみをダウンするときにはこれがいいらしい
# (参考: https://aton-kish.github.io/blog/post/2020/10/04/docker-compose-rm/)
.PHONY: db-down
db-down:
		docker-compose rm -fsv dev-postgres

# docker composeで立ち上がっているDBにprisma studioでつなぐコマンド
.PHONY: studio
studio:
		docker-compose exec backend-nestjs yarn prisma studio

.PHONY: ps
ps:
		docker-compose ps

.PHONY: migrate
migrate:
		cd $(BACKEND) && yarn && yarn migrate
		cd $(FRONTEND) && yarn && yarn migrate

.PHONY: setup
setup: migrate

.PHONY: clean
clean: down

.PHONY: fclean
fclean: down
#		docker stop $(shell docker ps -qa) 2>/dev/null              || :
#		docker rm $(shell docker ps -qa) 2>/dev/null                || :
#		docker rmi -f $(shell docker images -qa) 2>/dev/null        || :
#		docker volume rm $(shell docker volume ls -q) 2>/dev/null   || :
#		docker network rm $(shell docker network ls -q) 2>/dev/null || :

.PHONY: b
b:
	yarn --cwd ./backend start:dev

.PHONY: f
f:
	yarn --cwd ./frontend dev
