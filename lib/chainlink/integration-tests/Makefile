BIN_DIR = bin
export GOPATH ?= $(shell go env GOPATH)
export GO111MODULE ?= on

LINUX=LINUX
OSX=OSX
WINDOWS=WIN32
OSFLAG :=
ifeq ($(OS),Windows_NT)
	OSFLAG = $(WINDOWS)
else
	UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
		OSFLAG = $(LINUX)
endif
ifeq ($(UNAME_S),Darwin)
		OSFLAG = $(OSX)
endif
endif

install_qa_tools:
ifeq ($(OSFLAG),$(WINDOWS))
	echo "If you are running windows and know how to install what is needed, please contribute by adding it here!"
	echo "You will need nodejs, golang, k3d, and helm."
	exit 1
else

# linux and mac can use asdf to install all of the dependencies
ifeq ($(shell which asdf), )

# install asdf
ifeq ($(OSFLAG),$(LINUX))
	echo "You will need to install asdf via your linux installer https://asdf-vm.com/guide/getting-started.html"
	exit 1
else
ifeq ($(OSFLAG),$(OSX))
	brew install asdf
endif
endif
endif
# install the plugins if needed and then install the dependencies
	asdf plugin-add nodejs || true
	asdf plugin-add golang || true
	asdf plugin-add k3d || true
	asdf plugin-add helm || true
	asdf install
endif
# Now install the helm charts that are needed (should be os agnostic)
	helm repo add chainlink-qa https://raw.githubusercontent.com/smartcontractkit/qa-charts/gh-pages/
	helm repo add bitnami https://charts.bitnami.com/bitnami
	helm repo update

.PHONY: install_gotestfmt
install_gotestfmt:
	go install github.com/gotesttools/gotestfmt/v2/cmd/gotestfmt@latest
	set -euo pipefail

## All commands will use 16 threads to run tests in parallel. To change this, use -test.parallel n

# Smoke
.PHONY: test_smoke_raw # Run smoke tests without any gotestfmt or default args
test_smoke_raw:
	go test $(args) ./smoke

.PHONY: test_smoke
test_smoke: install_gotestfmt ## Run all smoke tests
	TEST_LOG_LEVEL="disabled" \
	go test -timeout 24h -count=1 -json $(args) ./smoke 2>&1 | tee /tmp/gotest.log | gotestfmt

.PHONY: test_smoke_simulated
test_smoke_simulated: install_gotestfmt ## Run all smoke tests on simulated blockchain
	TEST_LOG_LEVEL="disabled" \
	SELECTED_NETWORKS="SIMULATED,SIMULATED_1,SIMULATED_2" \
	go test -timeout 1h -count=1 -json $(args) ./smoke 2>&1 | tee /tmp/gotest.log | gotestfmt

.PHONY: test_smoke_verbose
test_smoke_verbose: install_gotestfmt ## Run all smoke tests with verbose logging
	go test -timeout 24h -count=1 -v -json $(args) ./smoke 2>&1 | tee /tmp/gotest.log | gotestfmt

.PHONY: test_smoke_product
test_smoke_product: ## Run smoke tests for specific product ex: make test_smoke_product product="cron" args="--focus @cron -p"
	ARGS="$(args)" PRODUCT=$(product) ./scripts/run_product_tests

# Chaos
.PHONY: test_chaos_raw
test_chaos_raw:
	go test -count=1 $(args) ./chaos

.PHONY: test_chaos
test_chaos: install_gotestfmt ## Run all smoke tests
	TEST_LOG_LEVEL="disabled" \
	go test -timeout 24h -count=1 -json $(args) ./chaos 2>&1 | tee /tmp/gotest.log | gotestfmt

.PHONY: test_chaos_verbose
test_chaos_verbose: install_gotestfmt ## Run all smoke tests with verbose logging
	go test -timeout 24h -count=1 -v -json $(args) ./chaos 2>&1 | tee /tmp/gotest.log | gotestfmt

# Performance
.PHONY: test_perf
test_perf: test_need_operator_assets ## Run core node performance tests.
	TEST_LOG_LEVEL="disabled" \
	SELECTED_NETWORKS="SIMULATED,SIMULATED_1,SIMULATED_2" \
	go test -timeout 1h -count=1 -json $(args) ./performance 2>&1 | tee /tmp/gotest.log | gotestfmt

# Soak
.PHONY: test_soak_ocr
test_soak_ocr:
	go test -v -count=1 -run TestOCRSoak ./soak

.PHONY: test_soak_ocr_simulated
test_soak_ocr_simulated:
	SELECTED_NETWORKS="SIMULATED" go test -v -count=1 -run TestOCRSoak ./soak

.PHONY: test_soak_forwarder_ocr
test_soak_forwarder_ocr:
	go test -v -count=1 -run TestForwarderOCRSoak ./soak

.PHONY: test_soak_forwarder_ocr_simulated
test_soak_forwarder_ocr_simulated:
	SELECTED_NETWORKS="SIMULATED" go test -v -count=1 -run TestForwarderOCRSoak ./soak

.PHONY: test_soak_keeper
test_soak_keeper: 
	go test -v -count=1 -run TestKeeperSoak ./soak

.PHONY: test_soak_keeper_simulated
test_soak_keeper_simulated:
	SELECTED_NETWORKS="SIMULATED" go test -v -count=1 -run TestKeeperSoak ./soak

.PHONY: test_benchmark_automation
test_benchmark_automation: test_need_operator_assets ## Run the automation benchmark tests
	go test -v -run ^TestAutomationBenchmark$$ ./benchmark -count=1
