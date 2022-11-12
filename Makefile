NAME = ft_transcendence
BACKEND = ./backend
FRONTEND = ./frontend

.PHONY: all
all: $(NAME)

$(NAME): setup
	docker-compose up --build -d

.PHONY: up
up:
		docker-compose up -d

.PHONY: down
down:
		docker-compose down

.PHONY: ps
ps:
		docker-compose ps

.PHONY: migrate
migrate:
		cd $(BACKEND) && yarn && yarn migrate

.PHONY: setup
setup: migrate
		cd $(FRONTEND) && yarn

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
