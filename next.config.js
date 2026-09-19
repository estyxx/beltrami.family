/** @type {import('next').NextConfig} */

module.exports = {
	reactStrictMode: true,
	// CLAUDE.md is hand-written; Next 16 otherwise appends a generated block to it.
	agentRules: false,
};
