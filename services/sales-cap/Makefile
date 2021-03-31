APP=sales-middleware-cap
DOCKER_URL:=ticid.docker.repositories.sap.ondemand.com/us/$(APP)
DOCKER_TAG=$(shell cat VERSION)

.PHONY: all dev openapi image image-push
all: dev

dev:
	npm i -g @sap/cds
	npm install
	npm run-script build

openapi:
	cds compile srv --service all -o docs --to openapi

image:
	docker build -t $(DOCKER_URL):$(DOCKER_TAG) .

image-push: image
	docker tag $(DOCKER_URL):$(DOCKER_TAG) $(DOCKER_URL):latest
	docker push $(DOCKER_URL):$(DOCKER_TAG)
	docker push $(DOCKER_URL):latest
