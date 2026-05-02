#!/bin/bash
set -e

# Ensure Go is on PATH
if ! command -v go &>/dev/null; then
  for dir in /usr/local/go/bin "$HOME/go-local/bin" "$HOME/sdk/go"*"/bin"; do
    if [ -x "$dir/go" ]; then
      export PATH="$dir:${PATH}"
      break
    fi
  done
fi

GO_BIN="${HOME}/go/bin"
export PATH="${GO_BIN}:${PATH}"

install_if_missing() {
  local bin="$1"
  local pkg="$2"
  if ! command -v "$bin" &>/dev/null; then
    echo "Installing $pkg..."
    go install "$pkg@latest"
  fi
}

# Ensure Go protoc plugins
install_if_missing protoc-gen-go google.golang.org/protobuf/cmd/protoc-gen-go
install_if_missing protoc-gen-connect-go connectrpc.com/connect/cmd/protoc-gen-connect-go

# Ensure buf
install_if_missing buf github.com/bufbuild/buf/cmd/buf

echo "Generating Go code..."
buf generate
echo "Done."
