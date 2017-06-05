(function(angular) {
    'use strict';

    var url = 'https://upload.wistia.com/?access_token='+API_TOKEN;
    var mediaUrl = 'https://api.wistia.com/v1/medias.json';
    var apiPassword = API_TOKEN;
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
                        maxFileSize: 40000000,
                        acceptFileTypes: /(\.|\/)(mp4|mov|MOV)$/i
                    });
            }
        ])
        .component('videoUploader', {
            transclude: true,
            controller: function videoUploaderCtrl($scope, $http, $window, $filter, $timeout) {
                var status = null;
                //Watch for video status from Wistia API
                $scope.$watch('status', function(newVal, oldVal) {

                  console.log(newVal, 'new val');
                  if(newVal === 'queued') {
                    $scope.queued = "Video is being queued by Wistia..."
                  }

                }, true)
                
                $scope.getFile = function(file) {
                     console.log(file, 'the master file upload');
                }
                

                $scope.options = {
                    url: url,
                    done: function(e, data) {
                        console.log(data, 'done data');
                        //After upload get video from Wistia API 
                        getVideos();
                        //After upload is done clear out the files
                        var scope = data.scope;
                        scope.clear(data.files);
                       

                    }
                };

               $scope.loadingFiles = true;
               console.log($scope.loadingFiles, 'loading...');
        


                var getVideos = function() {
                   //$scope.progress = true;
                   console.log($scope.progress, 'progress...');
                    $http({
                        method: 'get',
                        url: mediaUrl,
                        params: {
                            api_password: apiPassword
                        }
                    }).then(function(response) {
                        console.log(response.data, 'res');
                        if (response.data.length === 0) {
                          $scope.messagetext = true;
                          return $scope.message = "There are no videos to show."
                        } else {
                          $scope.messagetext = false;
                          $scope.embedArray = response.data;
                          $scope.loadingFiles = false;
                          $scope.hashed_id = response.data[0].hashed_id;
                          
                          //Get video status for all videos in the array
                          angular.forEach($scope.embedArray, function (item) {
                                 $scope.status = item.status;
                            
                          })
                                               
                        }
                      

                    }).catch(function(error) {
                       $scope.loadingFiles = false;
                        //If error throw error
                        console.error("Error with GET request", error);
                    })

                }
                //Get videos from Wistia API right away. 
                getVideos();

            },
            templateUrl: 'app/video-uploader.html'
        })
 
})(window.angular);
