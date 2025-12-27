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
		"rect" : [ 100.0, 100.0, 900.0, 700.0 ],
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
		"description" : "SERGIK AI Controller - Full Ableton Live Integration",
		"digest" : "Natural language MIDI generation with complete Live Object Model control",
		"tags" : "SERGIK AI MIDI Generator Ableton Live",
		"style" : "",
		"subpatcher_template" : "",
		"assistshowspatchername" : 0,
		"boxes" : [ 			{
				"box" : 				{
					"id" : "title",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 20.0, 10.0, 300.0, 25.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 5.0, 400.0, 25.0 ],
					"text" : "🎛️ SERGIK AI Controller v2.0",
					"fontsize" : 16.0,
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
					"patching_rect" : [ 400.0, 500.0, 200.0, 22.0 ],
					"text" : "js SERGIK_AI_Controller.js"
				}
			},
			{
				"box" : 				{
					"id" : "status",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 20.0, 600.0, 600.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 650.0, 600.0, 20.0 ],
					"text" : "● READY - Waiting for connection..."
				}
			},
			{
				"box" : 				{
					"id" : "midiout",
					"maxclass" : "midiout",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 400.0, 600.0, 50.0, 22.0 ]
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
					"patching_rect" : [ 20.0, 50.0, 80.0, 25.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 40.0, 80.0, 25.0 ],
					"text" : "CHORDS",
					"texton" : "CHORDS",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "Generate Chords",
							"parameter_shortname" : "CHORDS",
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
					"text" : "generate_chords"
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
					"patching_rect" : [ 110.0, 50.0, 80.0, 25.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 100.0, 40.0, 80.0, 25.0 ],
					"text" : "BASS",
					"texton" : "BASS",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "Generate Bass",
							"parameter_shortname" : "BASS",
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
					"patching_rect" : [ 110.0, 80.0, 85.0, 22.0 ],
					"text" : "generate_bass"
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
					"patching_rect" : [ 200.0, 50.0, 80.0, 25.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 190.0, 40.0, 80.0, 25.0 ],
					"text" : "ARPS",
					"texton" : "ARPS",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "Generate Arps",
							"parameter_shortname" : "ARPS",
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
					"patching_rect" : [ 200.0, 80.0, 82.0, 22.0 ],
					"text" : "generate_arps"
				}
			},
			{
				"box" : 				{
					"id" : "btn_drums",
					"maxclass" : "live.text",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 290.0, 50.0, 80.0, 25.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 280.0, 40.0, 80.0, 25.0 ],
					"text" : "DRUMS",
					"texton" : "DRUMS",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "Generate Drums",
							"parameter_shortname" : "DRUMS",
							"parameter_type" : 2
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "msg_drums",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 290.0, 80.0, 85.0, 22.0 ],
					"text" : "generate_drums"
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
					"patching_rect" : [ 380.0, 50.0, 80.0, 25.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 370.0, 40.0, 80.0, 25.0 ],
					"text" : "INSERT",
					"texton" : "INSERT",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "Insert to Clip",
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
					"patching_rect" : [ 380.0, 80.0, 38.0, 22.0 ],
					"text" : "insert"
				}
			},
			{
				"box" : 				{
					"id" : "key_label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 20.0, 120.0, 40.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 75.0, 40.0, 20.0 ],
					"text" : "Key:"
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
					"patching_rect" : [ 60.0, 120.0, 80.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 55.0, 75.0, 100.0, 22.0 ],
					"items" : [ "10B", ",", "7A", ",", "11B", ",", "8A", ",", "9B", ",", "6A", ",", "12B", ",", "5A", ",", "1B", ",", "4A", ",", "2B", ",", "3A" ]
				}
			},
			{
				"box" : 				{
					"id" : "bars_label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 150.0, 120.0, 35.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 160.0, 75.0, 35.0, 20.0 ],
					"text" : "Bars:"
				}
			},
			{
				"box" : 				{
					"id" : "bars_num",
					"maxclass" : "live.numbox",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 185.0, 120.0, 50.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 200.0, 75.0, 50.0, 22.0 ],
					"minimum" : 1.0,
					"maximum" : 32.0,
					"value" : 8.0
				}
			},
			{
				"box" : 				{
					"id" : "style_label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 250.0, 120.0, 40.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 260.0, 75.0, 40.0, 20.0 ],
					"text" : "Style:"
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
					"patching_rect" : [ 290.0, 120.0, 90.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 305.0, 75.0, 100.0, 22.0 ],
					"items" : [ "house", ",", "techno", ",", "tech_house", ",", "jazz", ",", "hiphop", ",", "trap", ",", "dnb", ",", "ambient" ]
				}
			},
			{
				"box" : 				{
					"id" : "voicing_label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 390.0, 120.0, 50.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 415.0, 75.0, 50.0, 20.0 ],
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
					"patching_rect" : [ 440.0, 120.0, 70.0, 22.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 470.0, 75.0, 80.0, 22.0 ],
					"items" : [ "stabs", ",", "pads", ",", "leads", ",", "bass" ]
				}
			},
			{
				"box" : 				{
					"id" : "prompt_label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 20.0, 150.0, 120.0, 20.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 110.0, 120.0, 20.0 ],
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
					"patching_rect" : [ 20.0, 175.0, 500.0, 40.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 10.0, 135.0, 500.0, 35.0 ],
					"text" : "generate tech house chords in 10B"
				}
			},
			{
				"box" : 				{
					"id" : "prompt_prepend",
					"maxclass" : "prepend",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 20.0, 220.0, 85.0, 22.0 ],
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
					"patching_rect" : [ 540.0, 50.0, 60.0, 25.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 530.0, 40.0, 60.0, 25.0 ],
					"text" : "▶ PLAY",
					"texton" : "▶ PLAY",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "Play Notes",
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
					"patching_rect" : [ 540.0, 80.0, 32.0, 22.0 ],
					"text" : "play"
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
					"patching_rect" : [ 610.0, 50.0, 60.0, 25.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 600.0, 40.0, 60.0, 25.0 ],
					"text" : "CLEAR",
					"texton" : "CLEAR",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "Clear Buffer",
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
					"patching_rect" : [ 610.0, 80.0, 35.0, 22.0 ],
					"text" : "clear"
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
					"patching_rect" : [ 540.0, 120.0, 45.0, 45.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 530.0, 110.0, 55.0, 55.0 ],
					"annotation" : "Humanize",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_longname" : "Humanize",
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
					"patching_rect" : [ 600.0, 120.0, 45.0, 45.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 590.0, 110.0, 55.0, 55.0 ],
					"annotation" : "Density",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_longname" : "Density",
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
					"id" : "loadbang",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 700.0, 50.0, 58.0, 22.0 ],
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
					"patching_rect" : [ 700.0, 80.0, 29.5, 22.0 ],
					"text" : "10B"
				}
			},
			{
				"box" : 				{
					"id" : "init_bars",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 740.0, 80.0, 29.5, 22.0 ],
					"text" : "8"
				}
			},
			{
				"box" : 				{
					"id" : "init_style",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 780.0, 80.0, 50.0, 22.0 ],
					"text" : "house"
				}
			},
			{
				"box" : 				{
					"id" : "init_humanize",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 700.0, 110.0, 35.0, 22.0 ],
					"text" : "15"
				}
			},
			{
				"box" : 				{
					"id" : "init_density",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 740.0, 110.0, 35.0, 22.0 ],
					"text" : "60"
				}
			},
			{
				"box" : 				{
					"id" : "msg_humanize",
					"maxclass" : "prepend",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 540.0, 170.0, 85.0, 22.0 ],
					"text" : "prepend humanize"
				}
			},
			{
				"box" : 				{
					"id" : "msg_density",
					"maxclass" : "prepend",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 600.0, 170.0, 85.0, 22.0 ],
					"text" : "prepend density"
				}
			},
			{
				"box" : 				{
					"id" : "btn_health",
					"maxclass" : "live.text",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 680.0, 50.0, 60.0, 25.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 670.0, 40.0, 60.0, 25.0 ],
					"text" : "HEALTH",
					"texton" : "HEALTH",
					"saved_attribute_attributes" : 					{
						"valueof" : 						{
							"parameter_enum" : [ "off", "on" ],
							"parameter_longname" : "Check Health",
							"parameter_shortname" : "HEALTH",
							"parameter_type" : 2
						}
					}
				}
			},
			{
				"box" : 				{
					"id" : "msg_health",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 680.0, 80.0, 38.0, 22.0 ],
					"text" : "health"
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
					"source" : [ "btn_drums", 0 ],
					"destination" : [ "msg_drums", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_drums", 0 ],
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
					"source" : [ "btn_health", 0 ],
					"destination" : [ "msg_health", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_health", 0 ],
					"destination" : [ "js", 0 ]
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
					"source" : [ "dial_humanize", 0 ],
					"destination" : [ "msg_humanize", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_humanize", 0 ],
					"destination" : [ "js", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "dial_density", 0 ],
					"destination" : [ "msg_density", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "msg_density", 0 ],
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
					"source" : [ "loadbang", 0 ],
					"destination" : [ "init_style", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "loadbang", 0 ],
					"destination" : [ "init_humanize", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "loadbang", 0 ],
					"destination" : [ "init_density", 0 ]
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
			},
			{
				"patchline" : 				{
					"source" : [ "init_style", 0 ],
					"destination" : [ "style_menu", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "init_humanize", 0 ],
					"destination" : [ "dial_humanize", 0 ]
				}
			},
			{
				"patchline" : 				{
					"source" : [ "init_density", 0 ],
					"destination" : [ "dial_density", 0 ]
				}
			}
		],
		"parameters" : 		{
			"obj-btn_generate" : [ "btn_chords", "CHORDS", 0 ],
			"obj-btn_bass" : [ "btn_bass", "BASS", 0 ],
			"obj-btn_arps" : [ "btn_arps", "ARPS", 0 ],
			"obj-btn_drums" : [ "btn_drums", "DRUMS", 0 ],
			"obj-btn_insert" : [ "btn_insert", "INSERT", 0 ],
			"obj-btn_play" : [ "btn_play", "PLAY", 0 ],
			"obj-btn_clear" : [ "btn_clear", "CLEAR", 0 ],
			"obj-btn_health" : [ "btn_health", "HEALTH", 0 ],
			"obj-humanize" : [ "dial_humanize", "Humanize", 0 ],
			"obj-density" : [ "dial_density", "Density", 0 ],
			"parameterbanks" : 			{

			},
			"inherited_shortname" : 1
		},
		"dependency_cache" : [ 			{
				"name" : "SERGIK_AI_Controller.js",
				"bootpath" : "/Users/machd/sergik_custom_gpt/maxforlive",
				"type" : "TEXT",
				"implicit" : 1
			}
		],
		"autosave" : 0
	}
}

