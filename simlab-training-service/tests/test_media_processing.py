from simlab_training_service.media_processing import (
    VideoGeometry,
    build_master_playlist,
    build_renditions,
)


def test_renditions_include_supported_qualities_without_upscaling():
    renditions = build_renditions(VideoGeometry(1920, 1080))

    assert [(item.width, item.height) for item in renditions] == [
        (854, 480),
        (1280, 720),
        (1920, 1080),
    ]
    manifest = build_master_playlist(renditions)
    assert "RESOLUTION=854x480" in manifest
    assert "480p/index.m3u8" in manifest
    assert "1080p/index.m3u8" in manifest


def test_low_resolution_video_keeps_one_source_sized_variant():
    renditions = build_renditions(VideoGeometry(640, 360))

    assert len(renditions) == 1
    assert (renditions[0].width, renditions[0].height) == (640, 360)
