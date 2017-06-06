(function(angular) {
    'use strict';

    angular.module('app', ['blueimp.fileupload'])
        .config([
            '$httpProvider', 'fileUploadProvider',
            function($httpProvider, fileUploadProvider) {
                delete $httpProvider.defaults.headers.common['X-Requested-With'];
                fileUploadProvider.defaults.redirect = window.location.href.replace(
                    /\/[^\/]*$/,
                    '/cors/result.html?%s'
                );

                angular.extend(fileUploadProvider.defaults, {
                    // Enable image resizing, except for Android and Opera,
                    // which actually support image resizing, but fail to
                    // send Blob objects via XHR requests:
                    disableImageResize: /Android(?!.*Chrome)|Opera/
                        .test(window.navigator.userAgent),
                    maxFileSize: 400000000,
                    acceptFileTypes: /(\.|\/)(mp4|mov|MOV|avi)$/i
                });
            }
        ])
        .component('videoUploader', {
            transclude: true,
            controller: videoUploaderCtrl,
            controllerAs: 'vm',
            templateUrl: 'app/video-uploader.html'

        })

    function videoUploaderCtrl($scope, $http, $window, $filter, $timeout) {

        var self = this;

        //Wistia-upload-api config vars
        var wistiaApi = {
            url: 'https://upload.wistia.com/?access_token=' + API_TOKEN,
            mediaUrl: 'https://api.wistia.com/v1/medias.json',
            apiPassword: API_TOKEN
        }
        var status = null;

        //Define functions
        self.getFile = getFile;
        self.getVideo = getVideo;
        self.destroyVideo = destroyVideo;

        //Watch for video status from Wistia API
        $scope.$watch('status', function(newVal, oldVal) {

            console.log(newVal, 'new val');
            if (newVal === 'queued') {
                self.queued = "Video is being queued by Wistia..."
            }

        }, true)

        function getFile(file) {
            console.log(file, 'the master file upload');
        }


        self.options = {
            url: wistiaApi.url,
            done: function(e, data) {
                //After upload get video from Wistia API 
                self.getVideo();
                //After upload is done clear out the files
                var scope = data.scope;
                scope.clear(data.files);
            }
        };

        self.loadingFiles = true;
        console.log($scope.loadingFiles, 'loading...');

        function getVideo() {
            $http({
                method: 'get',
                url: wistiaApi.mediaUrl,
                params: {
                    api_password: wistiaApi.apiPassword
                }
            }).then(function(response) {
                if (response.data.length === 0) {
                    self.messagetext = true;
                    return self.message = "No videos to show."
                } else {
                    self.messagetext = false;
                    self.videoArray = response.data;
                    self.loadingFiles = false;
                    self.hashed_id = response.data[0].hashed_id;

                    //Get video status for all videos in the array
                    angular.forEach($scope.embedArray, function(item) {
                        $scope.status = item.status;

                    })

                }


            }).catch(function(error) {
                self.loadingFiles = false;
                //If error throw error
                console.error("Error with GET request", error);
            })

        }

        function destroyVideo(id) {
            var deleteVideo = $window.confirm('Are you sure you want to delete the Video?');
            if (deleteVideo) {
                $http({
                    method: 'delete',
                    url: 'https://api.wistia.com/v1/medias/' + id + '.json',
                    params: {
                        api_password: wistiaApi.apiPassword
                    }
                }).then(function(response) {
                    //After deleting video clear view and get videos
                    self.videoArray = [];
                    self.getVideo();
                }).catch(function(error) {
                    //If error throw error
                    console.error("Error with DELETE request", error);
                })

            }
        }

        //Get video files from Wistia API right away. 
        self.getVideo();


    }

})(window.angular);
