package market

import "errors"

var (
	ErrInvalidArgument     = errors.New("invalid argument")
	ErrUnknownSecurity     = errors.New("unknown security")
	ErrUpstreamUnavailable = errors.New("upstream unavailable")
)
