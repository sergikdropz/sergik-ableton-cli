{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 8,
			"minor" : 5,
			"revision" : 0,
			"architecture" : "x64",
			"modernui" : 1
		},
		"classnamespace" : "box",
		"rect" : [ 100.0, 100.0, 520.0, 760.0 ],
		"bglocked" : 0,
		"openinpresentation" : 1,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15.0, 15.0 ],
		"gridsnaponopen" : 1,
		"objectsnaponopen" : 1,
		"statusbarvisible" : 2,
		"toolbarvisible" : 1,
		"boxanimatetime" : 200,
		"enablehscroll" : 0,
		"enablevscroll" : 0,
		"description" : "SERGIK AI Editor (Popout)",
		"digest" : "Advanced controls + Generated Media browser",
		"tags" : "SERGIK AI Editor",
		"boxes" : [ 			{
				"box" : 				{
					"id" : "thispatcher",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 420.0, 15.0, 80.0, 22.0 ],
					"text" : "thispatcher"
				}
			},
			{
				"box" : 				{
					"id" : "title",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 15.0, 10.0, 320.0, 24.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 5.0, 420.0, 24.0 ],
					"text" : "SERGIK AI — Editor",
					"fontsize" : 16.0,
					"fontface" : 1
				}
			},
			{
				"box" : 				{
					"id" : "status_label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 15.0, 40.0, 260.0, 18.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 32.0, 480.0, 18.0 ],
					"text" : "Status: Ready"
				}
			},
			{
				"box" : 				{
					"id" : "hdr_pitch",
					"maxclass" : "live.text",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 15.0, 70.0, 240.0, 24.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 60.0, 480.0, 24.0 ],
					"text" : "Pitch & Time",
					"texton" : "Pitch & Time",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_longname" : "toggle_pitch",
							"parameter_shortname" : "PitchTime",
							"parameter_type" : 2,
							"parameter_mmax" : 1
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "panel_pitch",
					"maxclass" : "live.panel",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 15.0, 100.0, 480.0, 130.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 88.0, 480.0, 130.0 ],
					"varname" : "grp_pitch"
				}
			},
			{
				"box" : 				{
					"id" : "pitch_controls_note",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 25.0, 110.0, 460.0, 18.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 20.0, 98.0, 460.0, 18.0 ],
					"text" : "Fit to Scale / Invert / Add Interval / Stretch / Grid / Set Length / Humanize / Reverse / Legato"
				}
			},
			{
				"box" : 				{
					"id" : "hdr_transform",
					"maxclass" : "live.text",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 15.0, 240.0, 240.0, 24.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 228.0, 480.0, 24.0 ],
					"text" : "Transform",
					"texton" : "Transform",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_longname" : "toggle_transform",
							"parameter_shortname" : "Transform",
							"parameter_type" : 2,
							"parameter_mmax" : 1
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "panel_transform",
					"maxclass" : "live.panel",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 15.0, 270.0, 480.0, 110.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 256.0, 480.0, 110.0 ],
					"varname" : "grp_transform"
				}
			},
			{
				"box" : 				{
					"id" : "transform_controls_note",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 25.0, 280.0, 460.0, 18.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 20.0, 266.0, 460.0, 18.0 ],
					"text" : "Arpeggiate / Style / Steps / Distance / Rate / Gate / Auto / Transform"
				}
			},
			{
				"box" : 				{
					"id" : "hdr_generate",
					"maxclass" : "live.text",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 15.0, 390.0, 240.0, 24.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 376.0, 480.0, 24.0 ],
					"text" : "Generate",
					"texton" : "Generate",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_longname" : "toggle_generate",
							"parameter_shortname" : "Generate",
							"parameter_type" : 2,
							"parameter_mmax" : 1
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "panel_generate",
					"maxclass" : "live.panel",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 15.0, 420.0, 480.0, 150.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 404.0, 480.0, 150.0 ],
					"varname" : "grp_generate"
				}
			},
			{
				"box" : 				{
					"id" : "gen_note",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 25.0, 430.0, 470.0, 18.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 20.0, 414.0, 470.0, 18.0 ],
					"text" : "AI Generate buttons + Audio/MIDI toggles will live here."
				}
			},
			{
				"box" : 				{
					"id" : "hdr_media",
					"maxclass" : "live.text",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 15.0, 580.0, 240.0, 24.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 560.0, 480.0, 24.0 ],
					"text" : "Generated Media",
					"texton" : "Generated Media",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_longname" : "toggle_media",
							"parameter_shortname" : "Media",
							"parameter_type" : 2,
							"parameter_mmax" : 1
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "panel_media",
					"maxclass" : "live.panel",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 15.0, 610.0, 480.0, 130.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 588.0, 480.0, 160.0 ],
					"varname" : "grp_media"
				}
			},
			{
				"box" : 				{
					"id" : "media_list",
					"maxclass" : "jit.cellblock",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "", "", "", "" ],
					"patching_rect" : [ 25.0, 620.0, 220.0, 110.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 20.0, 596.0, 220.0, 140.0 ],
					"varname" : "media_list_view"
				}
			},
			{
				"box" : 				{
					"id" : "buffer_audio",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 260.0, 620.0, 90.0, 22.0 ],
					"text" : "buffer~ sergik_audio"
				}
			},
			{
				"box" : 				{
					"id" : "waveform",
					"maxclass" : "waveform~",
					"numinlets" : 5,
					"numoutlets" : 6,
					"patching_rect" : [ 260.0, 650.0, 230.0, 60.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 250.0, 596.0, 230.0, 60.0 ],
					"buffername" : "sergik_audio"
				}
			},
			{
				"box" : 				{
					"id" : "midi_summary",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 260.0, 720.0, 230.0, 18.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 250.0, 662.0, 230.0, 74.0 ],
					"text" : "MIDI piano-roll summary (placeholder)"
				}
			},
			{
				"box" : 				{
					"id" : "toggles_router",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 15.0, 705.0, 180.0, 22.0 ],
					"text" : "route toggle_pitch toggle_transform toggle_generate toggle_media"
				}
			},
			{
				"box" : 				{
					"id" : "sel_pitch",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "bang" ],
					"patching_rect" : [ 15.0, 735.0, 60.0, 22.0 ],
					"text" : "sel 1 0"
				}
			},
			{
				"box" : 				{
					"id" : "msg_show_pitch",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 85.0, 735.0, 120.0, 22.0 ],
					"text" : "script show grp_pitch"
				}
			},
			{
				"box" : 				{
					"id" : "msg_hide_pitch",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 210.0, 735.0, 120.0, 22.0 ],
					"text" : "script hide grp_pitch"
				}
			}
		],
		"lines" : [ 			{
				"patchline" : 				{
					"source" : [ "hdr_pitch", 0 ],
					"destination" : [ "toggles_router", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "toggles_router", 0 ],
					"destination" : [ "sel_pitch", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "sel_pitch", 0 ],
					"destination" : [ "msg_show_pitch", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "sel_pitch", 1 ],
					"destination" : [ "msg_hide_pitch", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_show_pitch", 0 ],
					"destination" : [ "thispatcher", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_hide_pitch", 0 ],
					"destination" : [ "thispatcher", 0 ]
				}
			}
		]
	}
}


