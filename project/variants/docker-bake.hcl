# Rode de dentro de project/: docker buildx bake -f variants/docker-bake.hcl [variante...]
# O dockerfile de cada alvo é relativo ao seu contexto.

group "default" {
  targets = [
    "next-single-stage", "next-multistage-prod-deps", "next-standalone", "next-static-nginx",
    "go-golang-image", "go-distroless-static",
    "apt-cleanup-separate-run", "apt-cleanup-same-run", "apt-update-stale-cache",
    "python-pip", "python-alpine", "python-uv",
  ]
}

target "_frontend" { context = "frontend" }
target "_worker" { context = "worker" }
target "_api" { context = "api" }

target "next-single-stage" {
  inherits = ["_frontend"]
  dockerfile = "../variants/next-single-stage/Dockerfile"
  tags = ["variant/next-single-stage"]
}
target "next-multistage-prod-deps" {
  inherits = ["_frontend"]
  dockerfile = "../variants/next-multistage-prod-deps/Dockerfile"
  tags = ["variant/next-multistage-prod-deps"]
}
target "next-standalone" {
  inherits = ["_frontend"]
  dockerfile = "../variants/next-standalone/Dockerfile"
  tags = ["variant/next-standalone"]
}
target "next-static-nginx" {
  inherits = ["_frontend"]
  dockerfile = "../variants/next-static-nginx/Dockerfile"
  contexts = { variant = "variants/next-static-nginx" }
  tags = ["variant/next-static-nginx"]
}
target "go-golang-image" {
  inherits = ["_worker"]
  dockerfile = "../variants/go-golang-image/Dockerfile"
  tags = ["variant/go-golang-image"]
}
target "go-distroless-static" {
  inherits = ["_worker"]
  dockerfile = "../variants/go-distroless-static/Dockerfile"
  tags = ["variant/go-distroless-static"]
}
target "apt-cleanup-separate-run" {
  context = "variants/apt-cleanup-separate-run"
  tags = ["variant/apt-cleanup-separate-run"]
}
target "apt-cleanup-same-run" {
  context = "variants/apt-cleanup-same-run"
  tags = ["variant/apt-cleanup-same-run"]
}
target "apt-update-stale-cache" {
  context = "variants/apt-update-stale-cache"
  tags = ["variant/apt-update-stale-cache"]
}
target "python-pip" {
  inherits = ["_api"]
  dockerfile = "../variants/python-pip/Dockerfile"
  tags = ["variant/python-pip"]
}
target "python-alpine" {
  inherits = ["_api"]
  dockerfile = "../variants/python-alpine/Dockerfile"
  tags = ["variant/python-alpine"]
}
target "python-uv" {
  inherits = ["_api"]
  dockerfile = "../variants/python-uv/Dockerfile"
  tags = ["variant/python-uv"]
}
target "python-dhi" {
  inherits = ["_api"]
  dockerfile = "../variants/python-dhi/Dockerfile"
  tags = ["variant/python-dhi"]
}
