NAME = ft_transcendence

.PHONY: all
all: $(NAME)

$(NAME):
	docker-compose up --build -d

.PHONY: up
up:
		docker-compose up -d

.PHONY: down

down:
		docker-compose down

ps:
		docker-compose ps

.PHONY: clean
clean: down

.PHONY: fclean
fclean: down
#		docker stop $(shell docker ps -qa) 2>/dev/null              || :
#		docker rm $(shell docker ps -qa) 2>/dev/null                || :
#		docker rmi -f $(shell docker images -qa) 2>/dev/null        || :
#		docker volume rm $(shell docker volume ls -q) 2>/dev/null   || :
#		docker network rm $(shell docker network ls -q) 2>/dev/null || :

