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
		"rect" : [ 100.0, 100.0, 700.0, 500.0 ],
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
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 0,
		"enablevscroll" : 0,
		"devicewidth" : 0.0,
		"description" : "SERGIK AI Controller for Ableton Live",
		"digest" : "Natural language MIDI generation",
		"tags" : "SERGIK AI MIDI Generator",
		"style" : "",
		"subpatcher_template" : "",
		"assistshowspatchername" : 0,
		"boxes" : [ 			{
				"box" : 				{
					"id" : "title",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 20.0, 10.0, 200.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 5.0, 180.0, 20.0 ],
					"text" : "🎛️ SERGIK AI Controller",
					"fontsize" : 14.0,
					"fontface" : 1
				}
			},
			{
				"box" : 				{
					"id" : "js",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 4,
					"outlettype" : [ "", "", "", "" ],
					"patching_rect" : [ 250.0, 350.0, 200.0, 22.0 ],
					"text" : "js SERGIK_AI_Controller.js"
				}
			},
			{
				"box" : 				{
					"id" : "editor_bpatcher",
					"maxclass" : "bpatcher",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 470.0, 350.0, 20.0, 20.0 ],
					"presentation" : 0,
					"presentation_rect" : [ 0.0, 0.0, 10.0, 10.0 ],
					"args" : [ "SERGIK_AI_Editor.maxpat" ]
				}
			},
			{
				"box" : 				{
					"id" : "btn_chords",
					"maxclass" : "live.text",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 20.0, 50.0, 70.0, 25.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 30.0, 80.0, 25.0 ],
					"text" : "GENERATE",
					"texton" : "GENERATE",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "btn_generate",
							"parameter_mmax" : 1,
							"parameter_shortname" : "GENERATE",
							"parameter_type" : 2
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "msg_chords",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20.0, 80.0, 95.0, 22.0 ],
					"text" : "generate"
				}
			},
			{
				"box" : 				{
					"id" : "btn_bass",
					"maxclass" : "live.text",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 100.0, 50.0, 70.0, 25.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 95.0, 30.0, 70.0, 25.0 ],
					"text" : "COMMIT",
					"texton" : "COMMIT",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "btn_commit",
							"parameter_mmax" : 1,
							"parameter_shortname" : "COMMIT",
							"parameter_type" : 2
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "msg_bass",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 100.0, 80.0, 85.0, 22.0 ],
					"text" : "commit"
				}
			},
			{
				"box" : 				{
					"id" : "btn_arps",
					"maxclass" : "live.text",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 180.0, 50.0, 70.0, 25.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 170.0, 30.0, 80.0, 25.0 ],
					"text" : "EDITOR",
					"texton" : "EDITOR",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "btn_editor",
							"parameter_mmax" : 1,
							"parameter_shortname" : "EDITOR",
							"parameter_type" : 2
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "msg_arps",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 180.0, 80.0, 82.0, 22.0 ],
					"text" : "open_editor"
				}
			},
			{
				"box" : 				{
					"id" : "msg_open_editor",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 470.0, 380.0, 40.0, 22.0 ],
					"text" : "open"
				}
			},
			{
				"box" : 				{
					"id" : "key_label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 20.0, 115.0, 30.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 62.0, 42.0, 20.0 ],
					"text" : "Track:"
				}
			},
			{
				"box" : 				{
					"id" : "key_menu",
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 50.0, 115.0, 60.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 55.0, 62.0, 95.0, 22.0 ],
					"items" : [ "New", ",", "0", ",", "1", ",", "2", ",", "3", ",", "4", ",", "5", ",", "6", ",", "7", ",", "Master" ]
				}
			},
			{
				"box" : 				{
					"id" : "bars_label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 120.0, 115.0, 35.0, 20.0 ],
					"presentation" : 0,
					"presentation_rect" : [ 110.0, 70.0, 35.0, 20.0 ],
					"text" : "Bars:"
				}
			},
			{
				"box" : 				{
					"id" : "bars_num",
					"maxclass" : "number",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 155.0, 115.0, 40.0, 22.0 ],
					"presentation" : 0,
					"presentation_rect" : [ 145.0, 70.0, 40.0, 22.0 ],
					"minimum" : 1,
					"maximum" : 32
				}
			},
			{
				"box" : 				{
					"id" : "style_label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 20.0, 145.0, 35.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 160.0, 62.0, 35.0, 20.0 ],
					"text" : "Slot:"
				}
			},
			{
				"box" : 				{
					"id" : "style_menu",
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 55.0, 145.0, 70.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 200.0, 62.0, 95.0, 22.0 ],
					"items" : [ "mouse", ",", "0", ",", "1", ",", "2", ",", "3", ",", "4", ",", "5", ",", "6", ",", "7", ",", "next", ",", "append" ]
				}
			},
			{
				"box" : 				{
					"id" : "voicing_label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 135.0, 145.0, 48.0, 20.0 ],
					"presentation" : 0,
					"presentation_rect" : [ 125.0, 100.0, 48.0, 20.0 ],
					"text" : "Voicing:"
				}
			},
			{
				"box" : 				{
					"id" : "voicing_menu",
					"maxclass" : "umenu",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 183.0, 145.0, 60.0, 22.0 ],
					"presentation" : 0,
					"presentation_rect" : [ 173.0, 100.0, 60.0, 22.0 ],
					"items" : [ "stabs", ",", "pads" ]
				}
			},
			{
				"box" : 				{
					"id" : "prompt_label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 280.0, 50.0, 100.0, 20.0 ],
					"presentation" : 0,
					"presentation_rect" : [ 10.0, 130.0, 100.0, 20.0 ],
					"text" : "Natural Language:"
				}
			},
			{
				"box" : 				{
					"id" : "prompt_input",
					"maxclass" : "textedit",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "", "int", "", "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 280.0, 70.0, 250.0, 40.0 ],
					"presentation" : 0,
					"presentation_rect" : [ 10.0, 150.0, 220.0, 35.0 ],
					"text" : "generate tech house chords in 10B"
				}
			},
			{
				"box" : 				{
					"id" : "prompt_prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 280.0, 120.0, 85.0, 22.0 ],
					"text" : "prepend prompt"
				}
			},
			{
				"box" : 				{
					"id" : "btn_play",
					"maxclass" : "live.text",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 20.0, 200.0, 50.0, 25.0 ],
					"presentation" : 0,
					"presentation_rect" : [ 10.0, 195.0, 50.0, 25.0 ],
					"text" : "▶ PLAY",
					"texton" : "▶ PLAY",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "btn_play",
							"parameter_mmax" : 1,
							"parameter_shortname" : "PLAY",
							"parameter_type" : 2
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "msg_play",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20.0, 230.0, 32.0, 22.0 ],
					"text" : "play"
				}
			},
			{
				"box" : 				{
					"id" : "btn_insert",
					"maxclass" : "live.text",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 80.0, 200.0, 55.0, 25.0 ],
					"presentation" : 0,
					"presentation_rect" : [ 65.0, 195.0, 55.0, 25.0 ],
					"text" : "INSERT",
					"texton" : "INSERT",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "btn_insert",
							"parameter_mmax" : 1,
							"parameter_shortname" : "INSERT",
							"parameter_type" : 2
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "msg_insert",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 80.0, 230.0, 38.0, 22.0 ],
					"text" : "insert"
				}
			},
			{
				"box" : 				{
					"id" : "btn_clear",
					"maxclass" : "live.text",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 145.0, 200.0, 50.0, 25.0 ],
					"presentation" : 0,
					"presentation_rect" : [ 125.0, 195.0, 50.0, 25.0 ],
					"text" : "CLEAR",
					"texton" : "CLEAR",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "btn_clear",
							"parameter_mmax" : 1,
							"parameter_shortname" : "CLEAR",
							"parameter_type" : 2
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "msg_clear",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 145.0, 230.0, 35.0, 22.0 ],
					"text" : "clear"
				}
			},
			{
				"box" : 				{
					"id" : "status",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 20.0, 420.0, 350.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 88.0, 280.0, 18.0 ],
					"text" : "● READY"
				}
			},
			{
				"box" : 				{
					"id" : "dial_humanize",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 320.0, 90.0, 45.0, 45.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 110.0, 55.0, 55.0 ],
					"annotation" : "Humanize",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_longname" : "humanize",
							"parameter_shortname" : "Humanize",
							"parameter_type" : 0,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 100.0,
							"parameter_initial" : 15.0
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "dial_density",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 380.0, 90.0, 45.0, 45.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 75.0, 110.0, 55.0, 55.0 ],
					"annotation" : "Density",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_longname" : "density",
							"parameter_shortname" : "Density",
							"parameter_type" : 0,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 100.0,
							"parameter_initial" : 60.0
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "midiout",
					"maxclass" : "midiout",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 250.0, 420.0, 50.0, 22.0 ]
				}
			},
			{
				"box" : 				{
					"id" : "loadbang",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 550.0, 50.0, 58.0, 22.0 ],
					"text" : "loadbang"
				}
			},
			{
				"box" : 				{
					"id" : "init_key",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 550.0, 80.0, 29.5, 22.0 ],
					"text" : "0"
				}
			},
			{
				"box" : 				{
					"id" : "init_bars",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 590.0, 80.0, 29.5, 22.0 ],
					"text" : "8"
				}
			}
		],
		"lines" : [ 			{
				"patchline" : 				{
					"source" : [ "btn_chords", 0 ],
					"destination" : [ "msg_chords", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_chords", 0 ],
					"destination" : [ "js", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "btn_bass", 0 ],
					"destination" : [ "msg_bass", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_bass", 0 ],
					"destination" : [ "js", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "btn_arps", 0 ],
					"destination" : [ "msg_arps", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_arps", 0 ],
					"destination" : [ "js", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_arps", 0 ],
					"destination" : [ "msg_open_editor", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_open_editor", 0 ],
					"destination" : [ "editor_bpatcher", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "key_menu", 1 ],
					"destination" : [ "js", 1 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "bars_num", 0 ],
					"destination" : [ "js", 2 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "style_menu", 1 ],
					"destination" : [ "js", 3 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "voicing_menu", 1 ],
					"destination" : [ "js", 4 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "prompt_input", 0 ],
					"destination" : [ "prompt_prepend", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "prompt_prepend", 0 ],
					"destination" : [ "js", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "btn_play", 0 ],
					"destination" : [ "msg_play", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_play", 0 ],
					"destination" : [ "js", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "btn_insert", 0 ],
					"destination" : [ "msg_insert", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_insert", 0 ],
					"destination" : [ "js", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "btn_clear", 0 ],
					"destination" : [ "msg_clear", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_clear", 0 ],
					"destination" : [ "js", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "js", 0 ],
					"destination" : [ "midiout", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "js", 1 ],
					"destination" : [ "status", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "loadbang", 0 ],
					"destination" : [ "init_key", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "loadbang", 0 ],
					"destination" : [ "init_bars", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "init_key", 0 ],
					"destination" : [ "key_menu", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "init_bars", 0 ],
					"destination" : [ "bars_num", 0 ]
				}
			}
		],
		"parameters" : 		{
			"obj-btn_generate" : [ "btn_chords", "GENERATE", 0 ],
			"obj-btn_commit" : [ "btn_bass", "COMMIT", 0 ],
			"obj-btn_editor" : [ "btn_arps", "EDITOR", 0 ],
			"obj-btn_play" : [ "btn_play", "PLAY", 0 ],
			"obj-btn_insert" : [ "btn_insert", "INSERT", 0 ],
			"obj-btn_clear" : [ "btn_clear", "CLEAR", 0 ],
			"obj-humanize" : [ "dial_humanize", "Humanize", 0 ],
			"obj-density" : [ "dial_density", "Density", 0 ],
			"parameterbanks" : 			{

			},
			"inherited_shortname" : 1
		},
		"dependency_cache" : [ 			{
				"name" : "SERGIK_AI_Controller.js",
				"bootpath" : "~/sergik_custom_gpt/maxforlive",
				"type" : "TEXT",
				"implicit" : 1
			}
		],
		"autosave" : 0
	}
}

