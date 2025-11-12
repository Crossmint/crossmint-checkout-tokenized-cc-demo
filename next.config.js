const { NextConfig } = require("next");

const nextConfig = {
	webpack: (config, { isServer }) => {
		// Ignore React Native modules that are not needed in web environment
		config.resolve.alias = {
			...config.resolve.alias,
			"@react-native-async-storage/async-storage": false,
		};

		return config;
	},
};

module.exports = nextConfig;
