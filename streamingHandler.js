"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
////////////////////////////////////////////////////////////////////////////////////
//  Azure Media Services Live streaming sample for Node.js
//
//  This sample assumes that you will use OBS Studio to broadcast RTMP
//  to the ingest endpoint. Please install OBS Studio first. 
//  Use the following settings in OBS:
//      Encoder: NVIDIA NVENC (if avail) or x264
//      Rate Control: CBR
//      Bitrate: 2500 Kbps (or something reasonable for your laptop)
//      Keyframe Interval : 2s, or 1s for low latency  
//      Preset : Low-latency Quality or Performance (NVENC) or "veryfast" using x264
//      Profile: high
//      GPU: 0 (Auto)
//      Max B-frames: 2
//      
//  The workflow for the sample and for the recommended use of the Live API:
//  1) Create the client for AMS using AAD service principal or managed ID
//  2) Set up your IP restriction allow objects for ingest and preview
//  3) Configure the Live Event object with your settings. Choose pass-through
//     or encoding channel type and size (720p or 1080p)
//  4) Create the Live Event without starting it
//  5) Create an Asset to be used for recording the live stream into
//  6) Create a Live Output, which acts as the "recorder" to record into the
//     Asset (which is like the tape in the recorder).
//  7) Start the Live Event - this can take a little bit.
//  8) Get the preview endpoint to monitor in a player for DASH or HLS.
//  9) Get the ingest RTMP endpoint URL for use in OBS Studio.
//     Set up OBS studio and start the broadcast.  Monitor the stream in 
//     your DASH or HLS player of choice. 
// 10) Create a new Streaming Locator on the recording Asset object from step 5.
// 11) Get the URLs for the HLS and DASH manifest to share with your audience
//     or CMS system. This can also be created earlier after step 5 if desired.
////////////////////////////////////////////////////////////////////////////////////
// <ImportMediaServices>
var uuid_1 = require("uuid");
// Load the .env file if it exists
var dotenv = require("dotenv");
var identity_1 = require("@azure/identity");
var arm_mediaservices_1 = require("@azure/arm-mediaservices");
// </ImportMediaServices>
dotenv.config();
// This is the main Media Services client object
var mediaServicesClient;
// <LongRunningOperation>
// Long running operation polling interval in milliseconds
var longRunningOperationUpdateIntervalMs = 2000;
// </LongRunningOperation>
// Copy the samples.env file and rename it to .env first, then populate it's values with the values obtained 
// from your Media Services account's API Access page in the Azure portal.
var clientId = process.env.AZURE_CLIENT_ID;
var secret = process.env.AZURE_CLIENT_SECRET;
var subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
var resourceGroup = process.env.AZURE_RESOURCE_GROUP;
var accountName = process.env.AZURE_MEDIA_SERVICES_ACCOUNT_NAME;
// This sample uses the default Azure Credential object, which relies on the environment variable settings.
// If you wish to use User assigned managed identity, see the samples for v2 of @azure/identity
// Managed identity authentication is supported via either the DefaultAzureCredential or the ManagedIdentityCredential classes
// https://docs.microsoft.com/javascript/api/overview/azure/identity-readme?view=azure-node-latest
// See the following examples for how to authenticate in Azure with managed identity
// https://github.com/Azure/azure-sdk-for-js/blob/@azure/identity_2.0.1/sdk/identity/identity/samples/AzureIdentityExamples.md#authenticating-in-azure-with-managed-identity 
// const credential = new ManagedIdentityCredential("<USER_ASSIGNED_MANAGED_IDENTITY_CLIENT_ID>");
var credential = new identity_1.DefaultAzureCredential();
try {
    mediaServicesClient = new arm_mediaservices_1.AzureMediaServices(credential, subscriptionId);
}
catch (err) {
    console.log("Error retrieving Media Services Client.");
}
module.exports.createLiveEvent = function (user_id) { return __awaiter(void 0, void 0, void 0, function () {
    var uniqueness, liveEventName, assetName, liveOutputName, mediaAccount, liveEvent, liveOutput, allowAllInputRange, liveEventInputAccess, liveEventPreview, liveEventCreate, timeStart_1, asset, manifestName, liveOutputCreate, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                uniqueness = user_id;
                liveEventName = "".concat(uniqueness) // WARNING: Be careful not to leak live events using this sample!
                ;
                assetName = "".concat(uniqueness, "-") + Date.now();
                liveOutputName = "liveOutput-".concat(uniqueness);
                console.log("Starting the Live Streaming sample for Azure Media Services");
                return [4 /*yield*/, mediaServicesClient.mediaservices.get(resourceGroup, accountName)];
            case 1:
                // Get the media services account object for information on the current location. 
                mediaAccount = _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 7, , 8]);
                allowAllInputRange = {
                    name: "AllowAll",
                    address: "0.0.0.0",
                    subnetPrefixLength: 0
                };
                liveEventInputAccess = {
                    ip: {
                        allow: [
                            allowAllInputRange
                        ]
                    }
                };
                liveEventPreview = {
                    accessControl: {
                        ip: {
                            allow: [
                                allowAllInputRange
                            ]
                        }
                    }
                };
                liveEventCreate = {
                    location: mediaAccount.location,
                    description: "Sample Live Event from Node.js SDK sample",
                    useStaticHostname: true,
                    input: {
                        streamingProtocol: arm_mediaservices_1.KnownLiveEventInputProtocol.Rtmp,
                        accessControl: liveEventInputAccess,
                        // keyFrameIntervalDuration: "PT2S",  // Set this to match the ingest encoder's settings. This should not be used for encoding live events  
                        accessToken: "9eb1f703b149417c8448771867f48501" // Use this value when you want to make sure the ingest URL is static and always the same. If omitted, the service will generate a random GUID value.
                    },
                    encoding: {
                        encodingType: arm_mediaservices_1.KnownLiveEventEncodingType.PassthroughBasic
                    },
                    preview: liveEventPreview,
                    streamOptions: [
                        "LowLatency"
                    ]
                };
                console.log("Creating the LiveEvent, please be patient as this can take time to complete async.");
                console.log("Live Event creation is an async operation in Azure and timing can depend on resources available.");
                console.log();
                timeStart_1 = process.hrtime();
                return [4 /*yield*/, mediaServicesClient.liveEvents.beginCreateAndWait(resourceGroup, accountName, liveEventName, liveEventCreate, {
                        autoStart: false,
                        updateIntervalInMs: longRunningOperationUpdateIntervalMs // This sets the polling interval for the long running ARM operation (LRO)
                    }).then(function (liveEvent) {
                        var timeEnd = process.hrtime(timeStart_1);
                        console.info("Live Event Created - long running operation complete! Name: ".concat(liveEvent.name));
                        console.info("Execution time for create LiveEvent: %ds %dms", timeEnd[0], timeEnd[1] / 1000000);
                        console.log();
                    })["catch"](function (reason) {
                        console.log(reason);
                        if (reason.error && reason.error.message) {
                            console.info("Live Event creation failed: ".concat(reason.message));
                        }
                    })];
            case 3:
                _a.sent();
                console.log("Creating an asset named: ".concat(assetName));
                console.log();
                return [4 /*yield*/, mediaServicesClient.assets.createOrUpdate(resourceGroup, accountName, assetName, {})];
            case 4:
                asset = _a.sent();
                manifestName = "output";
                console.log("Creating a live output named: ".concat(liveOutputName));
                console.log();
                timeStart_1 = process.hrtime();
                liveOutputCreate = void 0;
                if (!asset.name) return [3 /*break*/, 6];
                liveOutputCreate = {
                    description: "Optional description when using more than one live output",
                    assetName: asset.name,
                    manifestName: manifestName,
                    archiveWindowLength: "PT1H",
                    hls: {
                        fragmentsPerTsSegment: 1 // Advanced setting when using HLS TS output only.
                    }
                };
                // Create and await the live output
                return [4 /*yield*/, mediaServicesClient.liveOutputs.beginCreateAndWait(resourceGroup, accountName, liveEventName, liveOutputName, liveOutputCreate, {
                        updateIntervalInMs: longRunningOperationUpdateIntervalMs // Setting this adjusts the polling interval of the long running operation. 
                    })
                        .then(function (liveOutput) {
                        console.log("Live Output Created: ".concat(liveOutput.name));
                        var timeEnd = process.hrtime(timeStart_1);
                        console.info("Execution time for create Live Output: %ds %dms", timeEnd[0], timeEnd[1] / 1000000);
                        console.log();
                    })["catch"](function (reason) {
                        console.log(reason);
                        if (reason.error && reason.error.message) {
                            console.info("Live Output creation failed: ".concat(reason.message));
                        }
                    })];
            case 5:
                // Create and await the live output
                _a.sent();
                _a.label = 6;
            case 6: 
            /*if (liveEventCreate.input != null) {
                liveEventCreate.input.accessToken = "8257f1d1-8247-4318-b743-f541c20ea7a6";
                liveEventCreate.hostnamePrefix = `${liveEventName}-updated`;
                // Calling update
                await mediaServicesClient.liveEvents.beginUpdateAndWait(
                    resourceGroup,
                    accountName,
                    liveEventName,
                    liveEventCreate
                ).then((liveEvent) => {
                    // The liveEvent returned here contains all of the updated properties you made above, and you can use the details in here to log or adjust your code.
                    console.log(`Updated the Live Event accessToken for live event named: ${liveEvent.name}`);
                })
                    .catch((reason) => {
                        // Check for ErrorResponse object
                        if (reason.error && reason.error.message) {
                            console.info(`Live Event Update failed: ${reason.message}`);
                        }
                    });
            }*/
            return [2 /*return*/, assetName];
            case 7:
                err_1 = _a.sent();
                console.log(err_1);
                console.error("WARNING: If you hit this message, double check the Portal to make sure you do not have any Running live events after using this Sample- or they will remain billing!");
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
module.exports.startLiveEvent = function (liveEventName) { return __awaiter(void 0, void 0, void 0, function () {
    var ingestUrl, timeStart, liveEvent, previewEndpoint;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                console.log("Starting the Live Event operation... please stand by");
                timeStart = process.hrtime();
                // Start the Live Event - this will take some time...
                console.log("The Live Event is being allocated. If the service's hot pool is completely depleted in a region, this could delay here for up to 15-20 minutes while machines are allocated.");
                console.log("If this is taking a very long time, wait for at least 20 minutes and check on the status. If the code times out, or is cancelled, be sure to clean up in the portal!");
                return [4 /*yield*/, mediaServicesClient.liveEvents.beginStartAndWait(resourceGroup, accountName, liveEventName, {
                        updateIntervalInMs: longRunningOperationUpdateIntervalMs // Setting this adjusts the polling interval of the long running operation. 
                    }).then(function () {
                        console.log("Live Event Started");
                        var timeEnd = process.hrtime(timeStart);
                        console.info("Execution time for start Live Event: %ds %dms", timeEnd[0], timeEnd[1] / 1000000);
                        console.log();
                    })
                    // <GetIngestURL>
                    // Refresh the liveEvent object's settings after starting it...
                ];
            case 1:
                _c.sent();
                return [4 /*yield*/, mediaServicesClient.liveEvents.get(resourceGroup, accountName, liveEventName)
                    // Get the RTMP ingest URL to configure in OBS Studio. 
                    // The endpoints is a collection of RTMP primary and secondary, and RTMPS primary and secondary URLs. 
                    // to get the primary secure RTMPS, it is usually going to be index 3, but you could add a  loop here to confirm...
                ];
            case 2:
                liveEvent = _c.sent();
                // Get the RTMP ingest URL to configure in OBS Studio. 
                // The endpoints is a collection of RTMP primary and secondary, and RTMPS primary and secondary URLs. 
                // to get the primary secure RTMPS, it is usually going to be index 3, but you could add a  loop here to confirm...
                if ((_a = liveEvent.input) === null || _a === void 0 ? void 0 : _a.endpoints) {
                    ingestUrl = liveEvent.input.endpoints[0].url;
                    console.log("The RTMP ingest URL to enter into OBS Studio is:");
                    console.log("RTMP ingest : ".concat(ingestUrl));
                    console.log("Make sure to enter a Stream Key into the OBS studio settings. It can be any value or you can repeat the accessToken used in the ingest URL path.");
                    console.log();
                }
                // </GetIngestURL>
                // <GetPreviewURL>
                if ((_b = liveEvent.preview) === null || _b === void 0 ? void 0 : _b.endpoints) {
                    previewEndpoint = liveEvent.preview.endpoints[0].url;
                    console.log("The preview url is:");
                    console.log(previewEndpoint);
                    console.log();
                    console.log("Open the live preview in your browser and use any DASH or HLS player to monitor the preview playback:");
                    console.log("https://ampdemo.azureedge.net/?url=".concat(previewEndpoint, "(format=mpd-time-cmaf)&heuristicprofile=lowlatency"));
                    console.log("You will need to refresh the player page SEVERAL times until enough data has arrived to allow for manifest creation.");
                    console.log("In a production player, the player can inspect the manifest to see if it contains enough content for the player to load and auto reload.");
                    console.log();
                }
                return [2 /*return*/, ingestUrl];
        }
    });
}); };
module.exports.createStreamingEndpoint = function (assetName, manifestName) { return __awaiter(void 0, void 0, void 0, function () {
    var uniqueness, streamingLocatorName, streamingEndpointName, locator, streamingEndpoint, hostname, scheme, hlsManifest;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                uniqueness = (0, uuid_1.v4)().split('-')[0];
                streamingLocatorName = "liveStreamLocator-".concat(uniqueness);
                streamingEndpointName = "default";
                // Create the Streaming Locator URL for playback of the contents in the Live Output recording
                console.log("Creating a streaming locator named : ".concat(streamingLocatorName));
                console.log();
                return [4 /*yield*/, createStreamingLocator(assetName, streamingLocatorName)];
            case 1:
                locator = _a.sent();
                return [4 /*yield*/, mediaServicesClient.streamingEndpoints.get(resourceGroup, accountName, streamingEndpointName)];
            case 2:
                streamingEndpoint = _a.sent();
                if (!((streamingEndpoint === null || streamingEndpoint === void 0 ? void 0 : streamingEndpoint.resourceState) !== "Running")) return [3 /*break*/, 4];
                console.log("Streaming endpoint is stopped. Starting the endpoint named ".concat(streamingEndpointName));
                return [4 /*yield*/, mediaServicesClient.streamingEndpoints.beginStartAndWait(resourceGroup, accountName, streamingEndpointName, {
                        updateIntervalInMs: longRunningOperationUpdateIntervalMs // Setting this adjusts the polling interval of the long running operation. 
                    })
                        .then(function () {
                        console.log("Streaming Endpoint Started.");
                    })];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                // Get the url to stream the output
                console.log("The streaming URLs to stream the live output from a client player");
                console.log();
                hostname = streamingEndpoint.hostName;
                scheme = "https";
                return [4 /*yield*/, buildManifestPaths(scheme, hostname, locator.streamingLocatorId, manifestName)];
            case 5:
                hlsManifest = _a.sent();
                return [2 /*return*/, hlsManifest];
        }
    });
}); };
module.exports.cleanUpResources = function (liveEventName, liveOutputName) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Cleaning up resources, stopping Live Event billing, and deleting live Event...");
                console.log("CRITICAL WARNING ($$$$) DON'T WASTE MONEY!: - Wait here for the All Clear - this takes a few minutes sometimes to clean up. DO NOT STOP DEBUGGER yet or you will leak billable resources!");
                return [4 /*yield*/, cleanUpResources(liveEventName, liveOutputName)];
            case 1:
                _a.sent();
                console.log("All Clear, and all cleaned up. Please double check in the portal to make sure you have not leaked any Live Events, or left any Running still which would result in unwanted billing.");
                return [2 /*return*/];
        }
    });
}); };
module.exports.stopStream = function (liveEventName /*, liveOutputName: string*/) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Cleaning up resources, stopping Live Event billing...");
                console.log("CRITICAL WARNING ($$$$) DON'T WASTE MONEY!: - Wait here for the All Clear - this takes a few minutes sometimes to clean up. DO NOT STOP DEBUGGER yet or you will leak billable resources!");
                return [4 /*yield*/, stopStream(liveEventName /*, liveOutputName*/)];
            case 1:
                _a.sent();
                console.log("All Clear, and all cleaned up. Please double check in the portal to make sure you have not leaked any Live Events, or left any Running still which would result in unwanted billing.");
                return [2 /*return*/];
        }
    });
}); };
// <BuildManifestPaths>
// This method builds the manifest URL from the static values used during creation of the Live Output.
// This allows you to have a deterministic manifest path. <streaming endpoint hostname>/<streaming locator ID>/manifestName.ism/manifest(<format string>)
function buildManifestPaths(scheme, hostname, streamingLocatorId, manifestName) {
    return __awaiter(this, void 0, void 0, function () {
        var hlsFormat, dashFormat, manifestBase, hlsManifest, dashManifest;
        return __generator(this, function (_a) {
            hlsFormat = "format=m3u8-cmaf";
            dashFormat = "format=mpd-time-cmaf";
            manifestBase = "".concat(scheme, "://").concat(hostname, "/").concat(streamingLocatorId, "/").concat(manifestName, ".ism/manifest");
            hlsManifest = "".concat(manifestBase, "(").concat(hlsFormat, ")");
            console.log("The HLS (MP4) manifest URL is : ".concat(hlsManifest));
            console.log("Open the following URL to playback the live stream in an HLS compliant player (HLS.js, Shaka, ExoPlayer) or directly in an iOS device");
            console.log("".concat(hlsManifest));
            console.log();
            dashManifest = "".concat(manifestBase, "(").concat(dashFormat, ")");
            console.log("The DASH manifest URL is : ".concat(dashManifest));
            console.log("Open the following URL to playback the live stream from the LiveOutput in the Azure Media Player");
            console.log("https://ampdemo.azureedge.net/?url=".concat(dashManifest, "&heuristicprofile=lowlatency"));
            console.log();
            return [2 /*return*/, dashManifest];
        });
    });
}
// </BuildManifestPaths>
// This method demonstrates using the listPaths method on Streaming locators to print out the DASH and HLS manifest links
// Optionally you can just build the paths if you are setting the manifest name and would like to create the streaming 
// manifest URls before you actually start streaming.
// The paths in the function listPaths on streaming locators are not available until streaming has actually started.  
// Keep in mind that this workflow is not great when you need to have the manifest URL up front for a CMS. 
// It is just provided here for example of listing all the dynamic format paths available at runtime of the live event.
function listStreamingPaths(streamingLocatorName, scheme, hostname) {
    return __awaiter(this, void 0, void 0, function () {
        var streamingPaths, hlsManifest, dashManifest;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mediaServicesClient.streamingLocators.listPaths(resourceGroup, accountName, streamingLocatorName)];
                case 1:
                    streamingPaths = _a.sent();
                    // TODO : rewrite this to be more deterministic. 
                    if (streamingPaths.streamingPaths && streamingPaths.streamingPaths.length > 0) {
                        streamingPaths.streamingPaths.forEach(function (path) {
                            if (path.streamingProtocol == "Hls") {
                                if (path.paths) {
                                    path.paths.forEach(function (hlsFormat) {
                                        // Look for the CMAF HLS format URL. This is the most current HLS version supported
                                        if (hlsFormat.indexOf('m3u8-cmaf') > 0) {
                                            hlsManifest = "".concat(scheme, "://").concat(hostname).concat(hlsFormat);
                                            console.log("The HLS (MP4) manifest URL is : ".concat(hlsManifest));
                                            console.log("Open the following URL to playback the live stream in an HLS compliant player (HLS.js, Shaka, ExoPlayer) or directly in an iOS device");
                                            console.log("".concat(hlsManifest));
                                            console.log();
                                        }
                                    });
                                }
                            }
                            if (path.streamingProtocol == "Dash") {
                                if (path.paths) {
                                    path.paths.forEach(function (dashFormat) {
                                        // Look for the CMAF DASH format URL. This is the most current DASH version supported
                                        if (dashFormat.indexOf('cmaf') > 0) {
                                            dashManifest = "".concat(scheme, "://").concat(hostname).concat(dashFormat);
                                            console.log("The DASH manifest URL is : ".concat(dashManifest));
                                            console.log("Open the following URL to playback the live stream from the LiveOutput in the Azure Media Player");
                                            console.log("https://ampdemo.azureedge.net/?url=".concat(dashManifest, "&heuristicprofile=lowlatency\""));
                                            console.log();
                                        }
                                    });
                                }
                            }
                        });
                    }
                    else {
                        console.error("No streaming paths found. Make sure that the encoder is sending data to the ingest point.");
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// <CreateStreamingLocator>
function createStreamingLocator(assetName, locatorName) {
    return __awaiter(this, void 0, void 0, function () {
        var streamingLocator, locator;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    streamingLocator = {
                        assetName: assetName,
                        streamingPolicyName: "Predefined_ClearStreamingOnly" // no DRM or AES128 encryption protection on this asset. Clear means un-encrypted.
                    };
                    return [4 /*yield*/, mediaServicesClient.streamingLocators.create(resourceGroup, accountName, locatorName, streamingLocator)];
                case 1:
                    locator = _a.sent();
                    return [2 /*return*/, locator];
            }
        });
    });
}
// </CreateStreamingLocator>
// <CleanUpResources>
// Stops and cleans up all resources used in the sample
// Be sure to double check the portal to make sure you do not have any accidentally leaking resources that are in billable states.
function cleanUpResources(liveEventName, liveOutputName) {
    return __awaiter(this, void 0, void 0, function () {
        var liveOutputForCleanup, timeStart, liveEventForCleanup, deleteLiveEventOperation;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mediaServicesClient.liveOutputs.get(resourceGroup, accountName, liveEventName, liveOutputName)];
                case 1:
                    liveOutputForCleanup = _a.sent();
                    // First clean up and stop all live outputs - "recordings" 
                    // This will NOT delete the archive asset. It just stops the tape recording machine. 
                    // All tapes (asset objects) are retained in your storage account and can continue to be streamed
                    // as on-demand content without any changes. 
                    console.log("Deleting Live Output");
                    timeStart = process.hrtime();
                    if (!liveOutputForCleanup) return [3 /*break*/, 3];
                    return [4 /*yield*/, mediaServicesClient.liveOutputs.beginDeleteAndWait(resourceGroup, accountName, liveEventName, liveOutputName, {
                            updateIntervalInMs: longRunningOperationUpdateIntervalMs // Setting this adjusts the polling interval of the long running operation. 
                        })
                            .then(function () {
                            var timeEnd = process.hrtime(timeStart);
                            console.info("Execution time for delete live output: %ds %dms", timeEnd[0], timeEnd[1] / 1000000);
                            console.log();
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    ;
                    return [4 /*yield*/, mediaServicesClient.liveEvents.get(resourceGroup, accountName, liveEventName)];
                case 4:
                    liveEventForCleanup = _a.sent();
                    console.log("Stopping Live Event...");
                    if (!liveEventForCleanup) return [3 /*break*/, 8];
                    timeStart = process.hrtime();
                    if (!(liveEventForCleanup.resourceState == "Running")) return [3 /*break*/, 6];
                    return [4 /*yield*/, mediaServicesClient.liveEvents.beginStopAndWait(resourceGroup, accountName, liveEventName, {
                        // It can be faster to delete all live outputs first, and then delete the live event. 
                        // if you have additional workflows on the archive to run. Speeds things up!
                        //removeOutputsOnStop :true // this is OPTIONAL, but recommend deleting them manually first. 
                        }, {
                            updateIntervalInMs: longRunningOperationUpdateIntervalMs // Setting this adjusts the polling interval of the long running operation. 
                        })
                            .then(function () {
                            var timeEnd = process.hrtime(timeStart);
                            console.info("Execution time for Stop Live Event: %ds %dms", timeEnd[0], timeEnd[1] / 1000000);
                            console.log();
                        })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    timeStart = process.hrtime();
                    // Delete the Live Event
                    console.log("Deleting Live Event...");
                    return [4 /*yield*/, mediaServicesClient.liveEvents.beginDeleteAndWait(resourceGroup, accountName, liveEventName, {
                            updateIntervalInMs: longRunningOperationUpdateIntervalMs // Setting this adjusts the polling interval of the long running operation. 
                        })
                            .then(function () {
                            var timeEnd = process.hrtime(timeStart);
                            console.info("Execution time for Delete Live Event: %ds %dms", timeEnd[0], timeEnd[1] / 1000000);
                            console.log();
                        })
                        // IMPORTANT! Open the portal again and make CERTAIN that the live event is stopped and deleted - and that you do not have any billing live events running still.
                    ];
                case 7:
                    deleteLiveEventOperation = _a.sent();
                    _a.label = 8;
                case 8: return [2 /*return*/];
            }
        });
    });
}
function stopStream(liveEventName /*, liveOutputName: string*/) {
    return __awaiter(this, void 0, void 0, function () {
        var timeStart, liveEventForCleanup;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    timeStart = process.hrtime();
                    return [4 /*yield*/, mediaServicesClient.liveEvents.get(resourceGroup, accountName, liveEventName)];
                case 1:
                    liveEventForCleanup = _a.sent();
                    console.log("Stopping Live Event...");
                    if (!liveEventForCleanup) return [3 /*break*/, 4];
                    timeStart = process.hrtime();
                    if (!(liveEventForCleanup.resourceState == "Running")) return [3 /*break*/, 3];
                    return [4 /*yield*/, mediaServicesClient.liveEvents.beginStopAndWait(resourceGroup, accountName, liveEventName, {
                        // It can be faster to delete all live outputs first, and then delete the live event. 
                        // if you have additional workflows on the archive to run. Speeds things up!
                        //removeOutputsOnStop :true // this is OPTIONAL, but recommend deleting them manually first. 
                        }, {
                            updateIntervalInMs: longRunningOperationUpdateIntervalMs // Setting this adjusts the polling interval of the long running operation. 
                        })
                            .then(function () {
                            var timeEnd = process.hrtime(timeStart);
                            console.info("Execution time for Stop Live Event: %ds %dms", timeEnd[0], timeEnd[1] / 1000000);
                            console.log();
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    timeStart = process.hrtime();
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
