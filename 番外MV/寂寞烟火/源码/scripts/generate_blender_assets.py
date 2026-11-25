"""
Blender 3.4.1 headless 3D asset generator for 《寂寞烟火》 MV.
Generates 10 bespoke, beveled low-poly / pixel-storybook diorama GLB assets
matched to the nostalgic twilight slate-lavender & warm amber lantern palette.

Usage:
    blender --background --python scripts/generate_blender_assets.py
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Matrix, Euler

OUT_DIR = os.path.abspath("src/assets/models")
os.makedirs(OUT_DIR, exist_ok=True)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def srgb_to_linear(c):
    if c <= 0.04045:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4


def hex_rgba(hex_str, alpha=1.0):
    h = hex_str.lstrip("#")
    r = srgb_to_linear(int(h[0:2], 16) / 255.0)
    g = srgb_to_linear(int(h[2:4], 16) / 255.0)
    b = srgb_to_linear(int(h[4:6], 16) / 255.0)
    return (r, g, b, alpha)


def make_mat(name, hex_color, roughness=0.82, metallic=0.0, emit_hex=None, emit_strength=0.0, alpha=1.0):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = hex_rgba(hex_color, alpha)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.blend_method = "BLEND"
    if emit_hex and emit_strength > 0:
        # Blender 3.4 uses 'Emission' and 'Emission Strength'
        if "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = hex_rgba(emit_hex, 1.0)
        elif "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = hex_rgba(emit_hex, 1.0)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emit_strength
    return mat


def palette():
    """Shared twilight-storybook material library inspired by the reference MV."""
    return {
        "stone_dark": make_mat("StoneDark", "#3a4258", roughness=0.88),
        "stone_mid": make_mat("StoneMid", "#556078", roughness=0.85),
        "stone_light": make_mat("StoneLight", "#7e899f", roughness=0.82),
        "stone_cream": make_mat("StoneCream", "#c7c0b5", roughness=0.80),
        "basalt": make_mat("Basalt", "#2e3c52", roughness=0.90),
        "basalt_top": make_mat("BasaltTop", "#5d718c", roughness=0.84),
        "wood_dark": make_mat("WoodDark", "#463848", roughness=0.85),
        "wood_warm": make_mat("WoodWarm", "#7a5c58", roughness=0.80),
        "wood_plank": make_mat("WoodPlank", "#987c72", roughness=0.82),
        "iron": make_mat("Iron", "#24293b", roughness=0.55, metallic=0.45),
        "brass": make_mat("Brass", "#d4a862", roughness=0.38, metallic=0.65),
        "brass_glow": make_mat("BrassGlow", "#f0cb7e", roughness=0.35, metallic=0.4, emit_hex="#f5cc7a", emit_strength=1.4),
        "amber_glow": make_mat("AmberGlow", "#ffe8ad", roughness=0.3, emit_hex="#ffdfa0", emit_strength=2.8),
        "warm_window": make_mat("WarmWindow", "#ffd98a", roughness=0.3, emit_hex="#ffd480", emit_strength=2.2),
        "cyan_glow": make_mat("CyanGlow", "#9ce0f5", roughness=0.25, emit_hex="#8ed8f2", emit_strength=2.0),
        "pine_dark": make_mat("PineDark", "#2b3e52", roughness=0.88),
        "pine_mid": make_mat("PineMid", "#3b566d", roughness=0.86),
        "roof_slate": make_mat("RoofSlate", "#384159", roughness=0.78),
        "cottage_wall": make_mat("CottageWall", "#4a536b", roughness=0.85),
        "lighthouse_cream": make_mat("LighthouseCream", "#ded6c5", roughness=0.78),
        "lighthouse_coral": make_mat("LighthouseCoral", "#b86b64", roughness=0.78),
        "paper_cream": make_mat("PaperCream", "#f4ecd4", roughness=0.72),
        "paper_fold": make_mat("PaperFold", "#dfd5bc", roughness=0.76),
        "dawn_cloud": make_mat("DawnCloud", "#efe8d4", roughness=0.92),
        "dawn_cloud_shade": make_mat("DawnCloudShade", "#d5cbb9", roughness=0.92),
        "whale_blue": make_mat("WhaleBlue", "#5b9dff", roughness=0.5, emit_hex="#5b9dff", emit_strength=1.0),
        "claude_orange": make_mat("ClaudeOrange", "#ff9447", roughness=0.5, emit_hex="#ff9447", emit_strength=1.0),
        "crystal": make_mat("Crystal", "#c7d8f8", roughness=0.18, emit_hex="#a7c9fa", emit_strength=1.2, alpha=0.72),
    }


def add_beveled_box(name, size, loc, mat, rot=(0, 0, 0), bevel=0.04, parent=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    if bevel > 0:
        max_b = min(size[0], size[1], size[2]) * 0.22
        b = min(bevel, max_b)
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=b, segments=1, affect="EDGES", clamp_overlap=True)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = False
    obj = bpy.data.objects.new(name, mesh)
    obj.location = Vector(loc)
    obj.rotation_euler = Euler(rot, "XYZ")
    obj.data.materials.append(mat)
    bpy.context.scene.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    return obj


def add_prism(name, radius_bottom, radius_top, height, segs, loc, mat, rot=(0, 0, 0), bevel=0.02, parent=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=segs,
        radius1=radius_bottom,
        radius2=radius_top,
        depth=height,
    )
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bevel, height * 0.15), segments=1, affect="EDGES", clamp_overlap=True)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = False
    obj = bpy.data.objects.new(name, mesh)
    obj.location = Vector(loc)
    obj.rotation_euler = Euler(rot, "XYZ")
    obj.data.materials.append(mat)
    bpy.context.scene.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    return obj


def add_torus_ring(name, major_r, minor_r, major_segs, minor_segs, loc, mat, rot=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_torus_add(
        major_segments=major_segs,
        minor_segments=minor_segs,
        major_radius=major_r,
        minor_radius=minor_r,
        location=loc,
        rotation=rot,
    )
    obj = bpy.context.active_object
    obj.name = name
    for p in obj.data.polygons:
        p.use_smooth = False
    obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    return obj


def make_empty(name, loc=(0, 0, 0), parent=None):
    obj = bpy.data.objects.new(name, None)
    obj.location = Vector(loc)
    bpy.context.scene.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    return obj


def join_objects(objs, new_name, parent=None):
    meshes = [o for o in objs if o.type == "MESH"]
    if len(meshes) <= 1:
        return meshes[0] if meshes else None
    # Update depsgraph so every freshly-created object's matrix_world is exact
    bpy.context.view_layer.update()
    # Create an identity-transform anchor mesh at parent origin so join keeps local space exact
    anchor_mesh = bpy.data.meshes.new(new_name)
    anchor = bpy.data.objects.new(new_name, anchor_mesh)
    bpy.context.scene.collection.objects.link(anchor)
    if parent:
        anchor.parent = parent
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action="DESELECT")
    anchor.select_set(True)
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = anchor
    bpy.ops.object.join()
    joined = bpy.context.active_object
    joined.name = new_name
    return joined


def merge_subtree(parent_obj, merged_name):
    """Merge all direct mesh children of parent_obj into a single multi-material mesh."""
    children = [o for o in bpy.context.scene.objects if o.parent == parent_obj and o.type == "MESH"]
    return join_objects(children, merged_name, parent=parent_obj)


def export_glb(filename, merge_prefixes=None):
    # Optionally merge all static meshes not protected by keep prefixes
    keep = set(merge_prefixes or [])
    if keep != {"__NONE__"}:
        groups = {}
        for o in list(bpy.context.scene.objects):
            if o.type != "MESH":
                continue
            if any(o.name.startswith(p) for p in keep):
                continue
            key = o.parent.name if o.parent else "__ROOT__"
            groups.setdefault(key, []).append(o)
        for key, objs in groups.items():
            if len(objs) > 1:
                par = objs[0].parent
                join_objects(objs, f"{key}_Merged", parent=par)
    path = os.path.join(OUT_DIR, filename)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
        export_texcoords=False,
    )
    kb = os.path.getsize(path) / 1024.0
    print(f"Exported {filename} ({kb:.1f} KB)")


# ────────────────────────────────────────────────────────────────────
# 1. viaduct_bridge.glb — Stone Milestone Viaduct (Shots 1 & 10)
# ────────────────────────────────────────────────────────────────────
def build_viaduct_bridge():
    reset_scene()
    P = palette()
    root = make_empty("ViaductRoot")

    # Roadway deck of segmented beveled cobblestones (X length = 24, Y width = 3.2, Z height = 0 at top)
    for i in range(-10, 11):
        x = i * 1.35
        # Subtle curve in Y and gentle slope
        y = math.sin(i * 0.18) * 1.1
        z_top = -0.05 + math.cos(i * 0.12) * 0.04
        add_beveled_box(f"Deck_{i}", (1.32, 3.1, 0.36), (x, y, z_top - 0.18), P["stone_mid"] if i % 2 == 0 else P["stone_light"], bevel=0.05, parent=root)
        # Parapet curbs on both sides
        add_beveled_box(f"CurbL_{i}", (1.28, 0.24, 0.34), (x, y + 1.48, z_top + 0.17), P["stone_dark"], bevel=0.04, parent=root)
        add_beveled_box(f"CurbR_{i}", (1.28, 0.24, 0.34), (x, y - 1.48, z_top + 0.17), P["stone_dark"], bevel=0.04, parent=root)

        # Arch support piers every 3 segments
        if i % 3 == 0:
            add_beveled_box(f"Pier_{i}", (0.95, 2.75, 5.2), (x, y, z_top - 2.95), P["stone_dark"], bevel=0.06, parent=root)
            add_beveled_box(f"PierCap_{i}", (1.25, 3.25, 0.28), (x, y, z_top - 0.48), P["stone_cream"], bevel=0.04, parent=root)
            # Milestone lantern post on alternating sides
            side = 1 if (i // 3) % 2 == 0 else -1
            py = y + side * 1.52
            add_beveled_box(f"MileBase_{i}", (0.42, 0.42, 0.72), (x, py, z_top + 0.36), P["stone_cream"], bevel=0.05, parent=root)
            add_beveled_box(f"MilePost_{i}", (0.14, 0.14, 1.55), (x, py, z_top + 1.35), P["wood_dark"], bevel=0.02, parent=root)
            add_beveled_box(f"MileArm_{i}", (0.12, 0.55, 0.10), (x, py - side * 0.22, z_top + 2.08), P["iron"], bevel=0.02, parent=root)
            add_beveled_box(f"MileLantern_{i}", (0.26, 0.26, 0.34), (x, py - side * 0.42, z_top + 1.85), P["amber_glow"], bevel=0.04, parent=root)
            add_prism(f"MileCap_{i}", 0.24, 0.05, 0.16, 4, (x, py - side * 0.42, z_top + 2.08), P["iron"], rot=(0, 0, math.pi / 4), bevel=0.01, parent=root)

    # Under-deck arch ribs
    for k in range(-3, 3):
        cx = (k * 3 + 1.5) * 1.35
        cy = math.sin((k * 3 + 1.5) * 0.18) * 1.1
        for s in range(7):
            ang = math.pi * (s / 6.0)
            ax = cx - math.cos(ang) * 1.65
            az = -1.65 + math.sin(ang) * 1.2
            add_beveled_box(f"ArchRib_{k}_{s}", (0.58, 2.65, 0.36), (ax, cy, az), P["stone_mid"], rot=(0, -(ang - math.pi / 2), 0), bevel=0.03, parent=root)

    export_glb("viaduct_bridge.glb")


# ────────────────────────────────────────────────────────────────────
# 2. sea_arch_pillars.glb — Tidal Basalt Stepping Stones & Sea Arch (Shot 2)
# ────────────────────────────────────────────────────────────────────
def build_sea_arch_pillars():
    reset_scene()
    P = palette()
    root = make_empty("SeaArchRoot")

    # Curved stepping-stone basalt pillars emerging from sea
    stones = [
        (-5.6, 0.4, 0.95, 2.2),
        (-3.6, -0.3, 0.88, 2.4),
        (-1.6, 0.2, 1.05, 2.5),
        (0.4, -0.2, 0.92, 2.6),
        (2.4, 0.3, 1.08, 2.5),
        (4.5, -0.1, 1.15, 2.4),
        (6.8, 0.2, 1.35, 2.6),
    ]
    for idx, (x, y, rad, h) in enumerate(stones):
        add_prism(f"StepBase_{idx}", rad * 1.15, rad, h, 6, (x, y, -h / 2 + 0.02), P["basalt"], bevel=0.05, parent=root)
        add_prism(f"StepCap_{idx}", rad * 0.96, rad * 0.92, 0.22, 6, (x, y, 0.08), P["basalt_top"], bevel=0.04, parent=root)
        # Small companion cluster rocks
        add_prism(f"SubRockA_{idx}", rad * 0.48, rad * 0.42, h * 0.65, 6, (x + rad * 0.85, y + 0.55, -h * 0.38), P["basalt"], bevel=0.03, parent=root)
        if idx % 2 == 1:
            # Tiny glowing tide lantern on pillar rim
            add_beveled_box(f"TidePost_{idx}", (0.12, 0.12, 0.55), (x, y + rad * 0.72, 0.45), P["wood_dark"], bevel=0.02, parent=root)
            add_beveled_box(f"TideGlow_{idx}", (0.20, 0.20, 0.24), (x, y + rad * 0.72, 0.82), P["amber_glow"], bevel=0.03, parent=root)

    # Dramatic background basalt sea-arch rising out of the ocean behind the stepping stones
    arch_group = make_empty("SeaArchFormation", (1.2, 5.8, -1.2), parent=root)
    for s in range(13):
        t = s / 12.0
        ang = t * math.pi
        ax = -math.cos(ang) * 5.2
        az = math.sin(ang) * 4.8
        thickness = 1.45 - 0.45 * math.sin(ang)
        add_beveled_box(f"ArchBlock_{s}", (thickness, 1.85, 1.15), (ax, math.sin(s * 0.7) * 0.25, az), P["basalt"] if s % 2 == 0 else P["stone_dark"], rot=(0, -(ang - math.pi / 2), 0), bevel=0.08, parent=arch_group)
    # Deep sea legs
    add_prism("ArchLegL", 2.1, 1.6, 4.5, 6, (-5.2, 0, -1.8), P["basalt"], bevel=0.08, parent=arch_group)
    add_prism("ArchLegR", 2.3, 1.7, 4.5, 6, (5.2, 0, -1.8), P["basalt"], bevel=0.08, parent=arch_group)

    export_glb("sea_arch_pillars.glb")


# ────────────────────────────────────────────────────────────────────
# 3. coastal_lamp_pine.glb — Misty Night Lantern Ridge & Pines (Shots 3–5)
# ────────────────────────────────────────────────────────────────────
def build_coastal_lamp_pine():
    reset_scene()
    P = palette()
    root = make_empty("NightPathRoot")

    # Cobblestone curved ridge path
    for i in range(-7, 8):
        x = i * 1.45
        y = math.sin(i * 0.22) * 0.6
        add_beveled_box(f"PathSlab_{i}", (1.40, 2.9, 0.45), (x, y, -0.22), P["stone_dark"] if i % 2 == 0 else P["stone_mid"], bevel=0.06, parent=root)
        add_beveled_box(f"EdgeRock_{i}", (1.5, 0.9, 1.2), (x, y + 1.85, -0.45), P["basalt"], bevel=0.08, parent=root)

    # 5 named ornate curved coastal lamps (so Three.js can ignite them sequentially!)
    lamp_xs = [-6.0, -3.0, 0.0, 3.0, 6.0]
    for idx, lx in enumerate(lamp_xs):
        ly = math.sin((lx / 1.45) * 0.22) * 0.6 + 1.38
        lg = make_empty(f"CoastalLamp_{idx}", (lx, ly, 0.0), parent=root)
        add_prism(f"LampPed_{idx}", 0.32, 0.22, 0.55, 6, (0, 0, 0.27), P["stone_mid"], bevel=0.03, parent=lg)
        add_prism(f"LampPole_{idx}", 0.08, 0.06, 2.55, 8, (0, 0, 1.75), P["iron"], bevel=0.01, parent=lg)
        # Curved iron scroll arm
        add_beveled_box(f"LampArmA_{idx}", (0.10, 0.52, 0.09), (0, -0.22, 3.02), P["iron"], rot=(0.25, 0, 0), bevel=0.02, parent=lg)
        add_beveled_box(f"LampArmB_{idx}", (0.10, 0.45, 0.09), (0, -0.58, 3.08), P["iron"], rot=(-0.22, 0, 0), bevel=0.02, parent=lg)
        # Hanging lantern cage + glowing core (named LampCore_i)
        add_prism(f"LampRoof_{idx}", 0.30, 0.05, 0.20, 6, (0, -0.78, 2.95), P["iron"], bevel=0.01, parent=lg)
        add_prism(f"LampCore_{idx}", 0.21, 0.17, 0.36, 6, (0, -0.78, 2.68), P["amber_glow"], bevel=0.02, parent=lg)
        add_prism(f"LampBot_{idx}", 0.19, 0.06, 0.10, 6, (0, -0.78, 2.46), P["iron"], bevel=0.01, parent=lg)

    # Stylized layered coastal pines behind path
    pines = [(-5.0, 2.8, 1.15), (-1.6, 3.1, 1.35), (2.2, 2.9, 1.10), (5.2, 3.2, 1.28)]
    for idx, (px, py, sc) in enumerate(pines):
        pg = make_empty(f"Pine_{idx}", (px, py, 0.0), parent=root)
        add_prism(f"Trunk_{idx}", 0.22 * sc, 0.14 * sc, 1.6 * sc, 6, (0, 0, 0.8 * sc), P["wood_dark"], bevel=0.02, parent=pg)
        for tier in range(4):
            r = (1.15 - tier * 0.22) * sc
            z = (1.35 + tier * 0.72) * sc
            add_prism(f"Foliage_{idx}_{tier}", r, r * 0.15, 0.92 * sc, 7, (0, 0, z), P["pine_dark"] if tier % 2 == 0 else P["pine_mid"], bevel=0.03, parent=pg)

    export_glb("coastal_lamp_pine.glb", merge_prefixes=["LampCore_"])


# ────────────────────────────────────────────────────────────────────
# 4. time_tea_pavilion.glb — Shore of Time Tea Pavilion & Tidal Sundial (Shot 6)
# ────────────────────────────────────────────────────────────────────
def build_time_tea_pavilion():
    reset_scene()
    P = palette()
    root = make_empty("TimeShoreRoot")

    # Stepped semicircular stone tide terrace
    add_prism("TerraceMain", 6.2, 6.0, 0.55, 12, (0, 0, -0.275), P["stone_mid"], bevel=0.06, parent=root)
    add_prism("TerraceLower", 7.3, 7.1, 0.45, 12, (0, 0, -0.72), P["stone_dark"], bevel=0.06, parent=root)

    # Central sculpted Tidal Sundial (instead of a station clock!)
    sd = make_empty("TidalSundial", (0.0, 1.8, 0.0), parent=root)
    add_prism("SundialBase", 1.15, 0.95, 0.42, 8, (0, 0, 0.21), P["stone_light"], bevel=0.04, parent=sd)
    add_prism("SundialPlate", 0.92, 0.92, 0.14, 16, (0, 0, 0.49), P["stone_cream"], bevel=0.02, parent=sd)
    add_torus_ring("SundialRing", 0.82, 0.05, 24, 8, (0, 0, 0.56), P["brass"], parent=sd)
    # Glowing brass gnomon pointer
    add_beveled_box("SundialGnomon", (0.08, 0.78, 0.72), (0, 0.1, 0.85), P["brass_glow"], rot=(0.55, 0, 0), bevel=0.02, parent=sd)
    # 12 radial hour stones
    for h in range(12):
        ang = (h / 12.0) * math.tau
        add_beveled_box(f"HourTick_{h}", (0.08, 0.14, 0.06), (math.cos(ang) * 0.72, math.sin(ang) * 0.72, 0.58), P["amber_glow"] if h % 3 == 0 else P["brass"], rot=(0, 0, ang), bevel=0.01, parent=sd)

    # Left-back curved-eave Tea Pavilion (where Qwen arranges tea & lanterns)
    pav = make_empty("TeaPavilion", (-3.4, 2.2, 0.0), parent=root)
    add_prism("PavFloor", 1.9, 1.8, 0.24, 6, (0, 0, 0.12), P["wood_plank"], bevel=0.03, parent=pav)
    for k in range(6):
        ang = (k / 6.0) * math.tau
        px, py = math.cos(ang) * 1.45, math.sin(ang) * 1.45
        add_prism(f"PavCol_{k}", 0.10, 0.09, 2.55, 6, (px, py, 1.45), P["wood_warm"], bevel=0.01, parent=pav)
        # Hanging paper lanterns on front eaves
        if k in (0, 3, 4, 5):
            add_prism(f"PavLantern_{k}", 0.18, 0.16, 0.30, 8, (px * 1.15, py * 1.15, 2.38), P["amber_glow"], bevel=0.03, parent=pav)
    # Tiered upturned roof
    add_prism("PavRoof1", 2.45, 1.35, 0.62, 6, (0, 0, 2.95), P["roof_slate"], bevel=0.04, parent=pav)
    add_prism("PavRoof2", 1.50, 0.15, 0.72, 6, (0, 0, 3.55), P["stone_dark"], bevel=0.03, parent=pav)
    add_prism("PavFinial", 0.14, 0.04, 0.36, 6, (0, 0, 4.02), P["brass_glow"], bevel=0.01, parent=pav)
    # Low wooden tea table + 3 neat teacups
    add_beveled_box("TeaTable", (1.1, 0.7, 0.38), (0, -0.1, 0.43), P["wood_dark"], bevel=0.03, parent=pav)
    for c in (-0.32, 0.0, 0.32):
        add_prism(f"TeaCup_{c}", 0.07, 0.09, 0.12, 8, (c, -0.1, 0.68), P["stone_cream"], bevel=0.01, parent=pav)

    # Right-side stone lantern bench
    add_beveled_box("ShoreBench", (2.1, 0.62, 0.44), (3.4, 1.6, 0.22), P["wood_warm"], bevel=0.04, parent=root)
    add_prism("BenchLanternBase", 0.26, 0.18, 1.1, 4, (4.7, 1.6, 0.55), P["stone_light"], bevel=0.03, parent=root)
    add_beveled_box("BenchLanternGlow", (0.30, 0.30, 0.34), (4.7, 1.6, 1.25), P["amber_glow"], bevel=0.04, parent=root)
    add_prism("BenchLanternCap", 0.42, 0.08, 0.24, 4, (4.7, 1.6, 1.54), P["stone_dark"], rot=(0, 0, math.pi / 4), bevel=0.02, parent=root)

    export_glb("time_tea_pavilion.glb")


# ────────────────────────────────────────────────────────────────────
# 5. arched_footbridge.glb — Lantern Footbridge Goodbye (Shot 7)
# ────────────────────────────────────────────────────────────────────
def build_arched_footbridge():
    reset_scene()
    P = palette()
    root = make_empty("FootbridgeRoot")

    # Graceful arched wooden bridge spanning X = -6..+6, peaking at Z = 1.35
    n = 21
    for i in range(n):
        t = i / (n - 1)  # 0..1
        x = (t - 0.5) * 12.4
        z = math.sin(t * math.pi) * 1.35
        slope = math.cos(t * math.pi) * (1.35 * math.pi / 12.4)
        pitch = -math.atan(slope)
        add_beveled_box(f"Plank_{i}", (0.58, 2.35, 0.18), (x, 0, z - 0.09), P["wood_plank"] if i % 2 == 0 else P["wood_warm"], rot=(0, pitch, 0), bevel=0.03, parent=root)
        # Under-arch timber beams
        add_beveled_box(f"BeamL_{i}", (0.64, 0.20, 0.26), (x, 1.02, z - 0.26), P["wood_dark"], rot=(0, pitch, 0), bevel=0.02, parent=root)
        add_beveled_box(f"BeamR_{i}", (0.64, 0.20, 0.26), (x, -1.02, z - 0.26), P["wood_dark"], rot=(0, pitch, 0), bevel=0.02, parent=root)
        # Handrail bars
        add_beveled_box(f"RailL_{i}", (0.65, 0.12, 0.10), (x, 1.08, z + 0.85), P["wood_warm"], rot=(0, pitch, 0), bevel=0.02, parent=root)
        add_beveled_box(f"RailR_{i}", (0.65, 0.12, 0.10), (x, -1.08, z + 0.85), P["wood_warm"], rot=(0, pitch, 0), bevel=0.02, parent=root)

        # Newel posts with warm lantern finials at key stations
        if i in (0, 5, 10, 15, 20):
            for side in (-1, 1):
                add_beveled_box(f"Post_{i}_{side}", (0.18, 0.18, 1.15), (x, side * 1.08, z + 0.52), P["wood_dark"], bevel=0.02, parent=root)
                add_beveled_box(f"PostCap_{i}_{side}", (0.24, 0.24, 0.24), (x, side * 1.08, z + 1.22), P["amber_glow"], bevel=0.04, parent=root)
                add_prism(f"PostRoof_{i}_{side}", 0.24, 0.05, 0.14, 4, (x, side * 1.08, z + 1.40), P["iron"], rot=(0, 0, math.pi / 4), bevel=0.01, parent=root)
            # Bridge water piers
            if i in (5, 15):
                add_prism(f"WaterPierL_{i}", 0.24, 0.20, 3.4, 8, (x, 0.92, z - 1.85), P["wood_dark"], bevel=0.02, parent=root)
                add_prism(f"WaterPierR_{i}", 0.24, 0.20, 3.4, 8, (x, -0.92, z - 1.85), P["wood_dark"], bevel=0.02, parent=root)

    # Small folded cream letter left gently on the center railing (Claude's quiet note)
    add_beveled_box("LeftNote", (0.38, 0.28, 0.05), (0.6, 1.06, 2.24), P["paper_cream"], rot=(0.05, 0.0, 0.25), bevel=0.01, parent=root)

    # Dock platforms on either end
    add_beveled_box("DockWest", (3.2, 3.6, 0.48), (-7.7, 0, -0.24), P["stone_mid"], bevel=0.06, parent=root)
    add_beveled_box("DockEast", (3.2, 3.6, 0.48), (7.7, 0, -0.24), P["stone_mid"], bevel=0.06, parent=root)

    export_glb("arched_footbridge.glb")


# ────────────────────────────────────────────────────────────────────
# 6. mirror_pavilion.glb — Mirror-Water Reflection Pool (Shots 8–9)
# ────────────────────────────────────────────────────────────────────
def build_mirror_pavilion():
    reset_scene()
    P = palette()
    root = make_empty("MirrorPavilionRoot")

    # Ring of 16 carved stone rim blocks around a 4.6m radius reflection pool
    R = 4.6
    for i in range(16):
        ang = (i / 16.0) * math.tau
        x, y = math.cos(ang) * R, math.sin(ang) * R
        add_beveled_box(f"PoolRim_{i}", (1.92, 0.72, 0.36), (x, y, 0.10), P["stone_light"] if i % 2 == 0 else P["stone_mid"], rot=(0, 0, ang + math.pi / 2), bevel=0.05, parent=root)

    # 6 slender back-arc twilight stone colonnade pillars + curved lintel
    for i in range(6):
        ang = math.radians(30 + i * 24)
        x, y = math.cos(ang) * (R + 0.15), math.sin(ang) * (R + 0.15)
        add_prism(f"ColBase_{i}", 0.38, 0.32, 0.42, 8, (x, y, 0.45), P["stone_cream"], bevel=0.03, parent=root)
        add_prism(f"ColShaft_{i}", 0.22, 0.19, 3.4, 8, (x, y, 2.35), P["stone_light"], bevel=0.02, parent=root)
        add_prism(f"ColCap_{i}", 0.28, 0.38, 0.28, 8, (x, y, 4.18), P["stone_cream"], bevel=0.03, parent=root)
        # Floating lotus candle plinth on inner pool rim
        ix, iy = math.cos(ang) * (R - 0.8), math.sin(ang) * (R - 0.8)
        add_prism(f"LotusPad_{i}", 0.34, 0.28, 0.08, 6, (ix, iy, 0.05), P["paper_fold"], bevel=0.01, parent=root)
        add_prism(f"LotusFlame_{i}", 0.14, 0.10, 0.22, 6, (ix, iy, 0.20), P["amber_glow"], bevel=0.02, parent=root)

    # Back-arc lintel segments connecting columns
    for i in range(5):
        a0 = math.radians(30 + i * 24)
        a1 = math.radians(30 + (i + 1) * 24)
        am = (a0 + a1) * 0.5
        mx, my = math.cos(am) * (R + 0.15), math.sin(am) * (R + 0.15)
        add_beveled_box(f"Lintel_{i}", (2.15, 0.56, 0.34), (mx, my, 4.46), P["stone_mid"], rot=(0, 0, am + math.pi / 2), bevel=0.04, parent=root)

    # Foreground shallow viewing stone platform for Whale & Claude
    add_beveled_box("ViewDeckL", (2.4, 1.7, 0.26), (-2.1, -2.5, 0.05), P["stone_light"], bevel=0.05, parent=root)
    add_beveled_box("ViewDeckR", (2.4, 1.7, 0.26), (2.1, -2.5, 0.05), P["stone_light"], bevel=0.05, parent=root)

    export_glb("mirror_pavilion.glb")


# ────────────────────────────────────────────────────────────────────
# 7. dream_crescent_arch.glb — Floating Dream Arch & Lantern Shrine (Shot 11)
# ────────────────────────────────────────────────────────────────────
def build_dream_crescent_arch():
    reset_scene()
    P = palette()
    root = make_empty("DreamArchRoot")

    # Stepped floating stone island dais
    add_prism("DreamDais1", 4.2, 4.0, 0.42, 10, (0, 0, -0.21), P["stone_mid"], bevel=0.06, parent=root)
    add_prism("DreamDais2", 2.8, 3.8, 0.95, 10, (0, 0, -0.88), P["stone_dark"], bevel=0.06, parent=root)

    # Sculpted celestial crescent stone arch framing the dream vision
    arch = make_empty("CrescentArch", (0, 1.2, 0.1), parent=root)
    for i in range(15):
        t = i / 14.0
        ang = math.radians(-15 + t * 210)
        r = 2.75
        x = math.cos(ang) * r
        z = 1.9 + math.sin(ang) * r
        sc = 0.52 - 0.18 * abs(t - 0.5)
        add_beveled_box(f"CresBlock_{i}", (sc, 0.58, 0.52), (x, 0, z), P["stone_cream"] if i % 3 == 0 else P["stone_light"], rot=(0, -ang, 0), bevel=0.05, parent=arch)

    # Named rotating crystal ring inside the arch
    ring = make_empty("DreamRing", (0, 1.2, 2.2), parent=root)
    add_torus_ring("CrystalHalo", 1.85, 0.06, 28, 8, (0, 0, 0), P["brass_glow"], rot=(math.pi / 2, 0, 0), parent=ring)
    for k in range(6):
        ang = (k / 6.0) * math.tau
        add_prism(f"DreamShard_{k}", 0.14, 0.02, 0.36, 4, (math.cos(ang) * 1.85, 0, math.sin(ang) * 1.85), P["cyan_glow"], bevel=0.01, parent=ring)

    # Floating dream bubble lanterns around the shrine
    lanterns = [(-2.6, 0.4, 2.6), (2.7, 0.6, 2.9), (-1.9, -0.9, 1.8), (2.1, -0.7, 2.1)]
    for idx, (lx, ly, lz) in enumerate(lanterns):
        add_prism(f"FloatOrb_{idx}", 0.26, 0.26, 0.32, 8, (lx, ly, lz), P["crystal"], bevel=0.04, parent=root)
        add_prism(f"FloatCore_{idx}", 0.12, 0.12, 0.16, 6, (lx, ly, lz), P["amber_glow"], bevel=0.02, parent=root)

    export_glb("dream_crescent_arch.glb")


# ────────────────────────────────────────────────────────────────────
# 8. star_astrolabe.glb — Starlight Observatory Deck & Astrolabe (Shots 12–14)
# ────────────────────────────────────────────────────────────────────
def build_star_astrolabe():
    reset_scene()
    P = palette()
    root = make_empty("ObservatoryRoot")

    # Main circular observatory floor + upper lunar balcony (where Kimi stands)
    add_prism("ObsFloor", 5.8, 5.6, 0.52, 16, (0, 0, -0.26), P["stone_dark"], bevel=0.06, parent=root)
    add_prism("ObsInlay", 4.6, 4.6, 0.08, 16, (0, 0, 0.04), P["stone_mid"], bevel=0.02, parent=root)
    add_torus_ring("ObsFloorBrass", 3.9, 0.05, 32, 8, (0, 0, 0.08), P["brass"], parent=root)

    # Raised crescent lunar balcony at back-left
    add_beveled_box("LunarBalcony", (3.2, 1.8, 1.35), (-2.6, 3.2, 0.675), P["stone_mid"], bevel=0.06, parent=root)
    add_beveled_box("BalconyStep1", (1.2, 0.65, 0.45), (-0.7, 2.8, 0.225), P["stone_light"], bevel=0.04, parent=root)
    add_beveled_box("BalconyStep2", (1.2, 0.65, 0.90), (-1.2, 3.1, 0.45), P["stone_light"], bevel=0.04, parent=root)

    # Balustrade posts along the deck perimeter
    for i in range(12):
        ang = (i / 12.0) * math.tau
        bx, by = math.cos(ang) * 5.35, math.sin(ang) * 5.35
        add_prism(f"BalPost_{i}", 0.15, 0.13, 0.95, 6, (bx, by, 0.47), P["stone_light"], bevel=0.02, parent=root)
        if i % 3 == 0:
            add_prism(f"BalOrb_{i}", 0.14, 0.14, 0.18, 6, (bx, by, 1.05), P["cyan_glow"], bevel=0.02, parent=root)

    # Giant nested Astronomical Astrolabe Rings (named for real-time rotation in Three.js!)
    astro_pivot = make_empty("AstrolabePivot", (0.8, 2.8, 3.6), parent=root)
    ring_outer = make_empty("AstrolabeOuter", (0, 0, 0), parent=astro_pivot)
    add_torus_ring("RingOuterMesh", 3.0, 0.10, 36, 8, (0, 0, 0), P["brass"], rot=(math.pi / 2, 0, 0), parent=ring_outer)
    for k in range(8):
        ang = (k / 8.0) * math.tau
        add_beveled_box(f"OuterNode_{k}", (0.22, 0.22, 0.22), (math.cos(ang) * 3.0, 0, math.sin(ang) * 3.0), P["amber_glow"], bevel=0.03, parent=ring_outer)

    ring_mid = make_empty("AstrolabeMid", (0, 0, 0), parent=astro_pivot)
    add_torus_ring("RingMidMesh", 2.25, 0.08, 32, 8, (0, 0, 0), P["brass_glow"], rot=(0.45, 0.3, 0), parent=ring_mid)

    ring_inner = make_empty("AstrolabeInner", (0, 0, 0), parent=astro_pivot)
    add_torus_ring("RingInnerMesh", 1.45, 0.07, 28, 8, (0, 0, 0), P["cyan_glow"], rot=(0.2, 1.1, 0), parent=ring_inner)
    add_prism("StarCore", 0.34, 0.04, 0.65, 4, (0, 0, 0.32), P["amber_glow"], bevel=0.02, parent=ring_inner)
    add_prism("StarCoreBot", 0.04, 0.34, 0.65, 4, (0, 0, -0.32), P["amber_glow"], bevel=0.02, parent=ring_inner)

    # Support cradle beneath astrolabe
    add_prism("AstroPedestal", 0.95, 0.65, 1.15, 8, (0.8, 2.8, 0.55), P["stone_mid"], bevel=0.04, parent=root)

    export_glb("star_astrolabe.glb")


# ────────────────────────────────────────────────────────────────────
# 9. harbor_lighthouse.glb — Lighthouse Cove, Cottages & Pier (Shots 15–16)
# ────────────────────────────────────────────────────────────────────
def build_harbor_lighthouse():
    reset_scene()
    P = palette()
    root = make_empty("HarborRoot")

    # Foreground wooden overlook pier & terrace
    for i in range(14):
        x = -6.5 + i * 1.0
        add_beveled_box(f"PierDeck_{i}", (0.94, 3.4, 0.24), (x, -3.5, -0.12), P["wood_plank"] if i % 2 == 0 else P["wood_warm"], bevel=0.03, parent=root)
        if i % 3 == 0:
            add_prism(f"PierPileA_{i}", 0.18, 0.16, 2.4, 8, (x, -2.0, -1.2), P["wood_dark"], bevel=0.02, parent=root)
            add_prism(f"PierPileB_{i}", 0.18, 0.16, 2.4, 8, (x, -5.0, -1.2), P["wood_dark"], bevel=0.02, parent=root)
            # Low bollards along pier edge
            add_prism(f"Bollard_{i}", 0.16, 0.14, 0.52, 6, (x, -1.95, 0.26), P["stone_mid"], bevel=0.02, parent=root)
            if i in (0, 6, 12):
                add_beveled_box(f"PierLamp_{i}", (0.22, 0.22, 0.28), (x, -1.95, 0.68), P["amber_glow"], bevel=0.03, parent=root)

    # Rocky cove cliff island across the bay
    cove = make_empty("LighthouseIsland", (4.8, 6.2, -0.4), parent=root)
    add_prism("CliffMain", 4.8, 3.6, 2.6, 8, (0, 0, 0.4), P["basalt"], bevel=0.10, parent=cove)
    add_prism("CliffUpper", 2.8, 2.1, 1.8, 8, (1.2, 0.5, 2.2), P["stone_dark"], bevel=0.08, parent=cove)

    # Octagonal striped Lighthouse atop the upper cliff
    lh = make_empty("LighthouseTower", (1.3, 0.5, 3.1), parent=cove)
    bands = [
        (1.05, 0.92, 1.35, P["lighthouse_cream"]),
        (0.92, 0.80, 1.15, P["lighthouse_coral"]),
        (0.80, 0.70, 1.20, P["lighthouse_cream"]),
        (0.70, 0.62, 1.05, P["lighthouse_coral"]),
    ]
    cz = 0.0
    for idx, (r1, r2, h, mat) in enumerate(bands):
        add_prism(f"LHBand_{idx}", r1, r2, h, 8, (0, 0, cz + h / 2), mat, bevel=0.03, parent=lh)
        cz += h
    # Gallery deck + glowing lantern room + cupola roof
    add_prism("LHGallery", 0.92, 0.92, 0.20, 8, (0, 0, cz + 0.10), P["iron"], bevel=0.02, parent=lh)
    add_prism("LHLantern", 0.54, 0.54, 0.88, 8, (0, 0, cz + 0.64), P["amber_glow"], bevel=0.02, parent=lh)
    add_prism("LHRoof", 0.74, 0.08, 0.68, 8, (0, 0, cz + 1.40), P["lighthouse_coral"], bevel=0.02, parent=lh)

    # Terraced cliffside cottages with glowing amber windows
    cottages = [
        (-2.2, -0.4, 1.7, 1.45, 1.2, 1.35, 0.2),
        (-0.6, -1.2, 1.7, 1.25, 1.1, 1.15, -0.15),
        (-3.3, 0.6, 1.2, 1.35, 1.25, 1.25, 0.35),
        (2.8, -0.8, 1.5, 1.15, 1.05, 1.05, -0.28),
    ]
    for idx, (cx, cy, cz, w, d, h, rotz) in enumerate(cottages):
        cg = make_empty(f"Cottage_{idx}", (cx, cy, cz), parent=cove)
        cg.rotation_euler = Euler((0, 0, rotz), "XYZ")
        add_beveled_box(f"Wall_{idx}", (w, d, h), (0, 0, h / 2), P["cottage_wall"], bevel=0.04, parent=cg)
        add_prism(f"Roof_{idx}", max(w, d) * 0.86, 0.1, 0.75, 4, (0, 0, h + 0.36), P["roof_slate"], rot=(0, 0, math.pi / 4), bevel=0.03, parent=cg)
        # Warm glowing windows facing the harbor (-Y)
        add_beveled_box(f"WinA_{idx}", (0.26, 0.08, 0.34), (-w * 0.22, -d * 0.5, h * 0.56), P["warm_window"], bevel=0.01, parent=cg)
        add_beveled_box(f"WinB_{idx}", (0.26, 0.08, 0.34), (w * 0.22, -d * 0.5, h * 0.56), P["warm_window"], bevel=0.01, parent=cg)

    export_glb("harbor_lighthouse.glb")


# ────────────────────────────────────────────────────────────────────
# 10. origami_boat_rainbow.glb — Folded Origami Paper Boat, Voxel Rainbow, Dawn Clouds (Shots 15–18)
# ────────────────────────────────────────────────────────────────────
def build_origami_boat_rainbow():
    reset_scene()
    P = palette()
    root = make_empty("StoryPropsRoot")

    # 10A. Bespoke Folded 3D Origami Paper Boat (exact crisp creased origami geometry!)
    boat = make_empty("OrigamiBoat", (0, 0, 0), parent=root)
    bm = bmesh.new()
    # Hull vertices (Blender Z-up; boat points along +X)
    v_bow = bm.verts.new((1.15, 0.0, 0.52))
    v_stern = bm.verts.new((-1.15, 0.0, 0.52))
    v_keel_f = bm.verts.new((0.68, 0.0, 0.0))
    v_keel_b = bm.verts.new((-0.68, 0.0, 0.0))
    v_rim_l = bm.verts.new((0.0, 0.52, 0.44))
    v_rim_r = bm.verts.new((0.0, -0.52, 0.44))
    v_bot_l = bm.verts.new((0.0, 0.34, 0.04))
    v_bot_r = bm.verts.new((0.0, -0.34, 0.04))
    # Outer folded hull faces
    bm.faces.new((v_bow, v_rim_l, v_bot_l, v_keel_f))
    bm.faces.new((v_stern, v_keel_b, v_bot_l, v_rim_l))
    bm.faces.new((v_bow, v_keel_f, v_bot_r, v_rim_r))
    bm.faces.new((v_stern, v_rim_r, v_bot_r, v_keel_b))
    bm.faces.new((v_keel_f, v_bot_l, v_keel_b, v_bot_r))
    # Inner hollow pocket
    v_in_l = bm.verts.new((0.0, 0.30, 0.32))
    v_in_r = bm.verts.new((0.0, -0.30, 0.32))
    bm.faces.new((v_bow, v_in_l, v_rim_l))
    bm.faces.new((v_stern, v_rim_l, v_in_l))
    bm.faces.new((v_bow, v_rim_r, v_in_r))
    bm.faces.new((v_stern, v_in_r, v_rim_r))
    # Central origami triangular sail peak
    v_peak = bm.verts.new((0.0, 0.0, 0.96))
    v_sf = bm.verts.new((0.46, 0.0, 0.30))
    v_sb = bm.verts.new((-0.46, 0.0, 0.30))
    v_sl = bm.verts.new((0.0, 0.16, 0.28))
    v_sr = bm.verts.new((0.0, -0.16, 0.28))
    bm.faces.new((v_peak, v_sf, v_sl))
    bm.faces.new((v_peak, v_sl, v_sb))
    bm.faces.new((v_peak, v_sb, v_sr))
    bm.faces.new((v_peak, v_sr, v_sf))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=0.03)
    mesh = bpy.data.meshes.new("OrigamiBoatMesh")
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = False
    boat_obj = bpy.data.objects.new("OrigamiBoatMesh", mesh)
    boat_obj.data.materials.append(P["paper_cream"])
    bpy.context.scene.collection.objects.link(boat_obj)
    boat_obj.parent = boat
    # Tiny glowing paper-lantern candle inside the paper boat
    add_prism("BoatCandle", 0.09, 0.07, 0.18, 6, (0.28, 0.0, 0.38), P["amber_glow"], bevel=0.02, parent=boat)

    # 10B. Segmented 3D Voxel Pastel Rainbow Arch (for Shot 16: "渐灭的花火割不断彩虹")
    rainbow = make_empty("VoxelRainbow", (0, 0, 0), parent=root)
    rainbow_hex = ["#f4949c", "#f9b785", "#fae294", "#9ee0b8", "#8bd0f5", "#b7a4f7"]
    rb_mats = [make_mat(f"Rainbow_{i}", c, roughness=0.4, emit_hex=c, emit_strength=1.35) for i, c in enumerate(rainbow_hex)]
    segs = 26
    for band, rmat in enumerate(rb_mats):
        rad = 6.8 - band * 0.24
        for s in range(segs):
            t = s / (segs - 1)
            ang = math.radians(18 + t * 144)
            rx = math.cos(ang) * rad
            rz = math.sin(ang) * rad * 0.72
            add_beveled_box(f"RB_{band}_{s}", (0.42, 0.26, 0.21), (rx, band * 0.03, rz), rmat, rot=(0, -ang + math.pi / 2, 0), bevel=0.03, parent=rainbow)

    # 10C. Parting Dawn Voxel Cloud Banks (Left & Right, with Whale-Blue & Claude-Orange memory tiles!)
    for side_name, sx in (("DawnCloudLeft", -1), ("DawnCloudRight", 1)):
        cg = make_empty(side_name, (0, 0, 0), parent=root)
        blocks = [
            (0.0, 0.0, 0.0, 4.4, 0.9, 1.35, P["dawn_cloud"]),
            (sx * 1.4, 0.2, 0.85, 3.6, 0.8, 1.15, P["dawn_cloud"]),
            (sx * 2.1, -0.2, -0.72, 3.8, 0.85, 0.95, P["dawn_cloud_shade"]),
            (-sx * 1.6, 0.1, 0.35, 2.2, 0.75, 0.85, P["dawn_cloud"]),
            # Iconic subtle blue & orange pixel accent tiles embedded in cloud edge
            (-sx * 0.6, -0.46, 0.25, 0.38, 0.18, 0.38, P["whale_blue"]),
            (-sx * 0.2, -0.46, -0.15, 0.38, 0.18, 0.38, P["claude_orange"]),
        ]
        for idx, (bx, by, bz, w, d, h, m) in enumerate(blocks):
            add_beveled_box(f"{side_name}_B{idx}", (w, d, h), (bx, by, bz), m, bevel=0.06, parent=cg)

    export_glb("origami_boat_rainbow.glb", merge_prefixes=["BoatCandle"])


# ────────────────────────────────────────────────────────────────────
# 11. dawn_breakwater.glb — Dawn Sea Promenade & Twin Headlands (Shots 17–18)
# ────────────────────────────────────────────────────────────────────
def build_dawn_breakwater():
    reset_scene()
    P = palette()
    root = make_empty("DawnBreakwaterRoot")

    # Long serene dawn stone breakwater deck along foreground (Y = -2.2 -> Three.js z = +2.2)
    for i in range(-9, 10):
        x = i * 1.15
        add_beveled_box(f"DawnSlab_{i}", (1.12, 2.6, 0.36), (x, -2.2, -0.18), P["stone_cream"] if i % 2 == 0 else P["stone_light"], bevel=0.04, parent=root)
        add_beveled_box(f"DawnCurb_{i}", (1.10, 0.22, 0.16), (x, -0.95, 0.08), P["stone_mid"], bevel=0.03, parent=root)
        if i in (-6, 6):
            # Low stone mooring lantern posts at left & right edges (wide clear center for Whale & Claude)
            add_prism(f"DawnPost_{i}", 0.22, 0.18, 0.95, 6, (x, -0.98, 0.48), P["stone_mid"], bevel=0.03, parent=root)
            add_beveled_box(f"DawnLamp_{i}", (0.24, 0.24, 0.26), (x, -0.98, 1.08), P["amber_glow"], bevel=0.03, parent=root)

    # Twin poetic distant terraced headlands / sea-stacks framing the dawn horizon
    for side in (-1, 1):
        hx = side * 7.8
        hy = 9.5
        hg = make_empty(f"Headland_{side}", (hx, hy, -0.4), parent=root)
        add_prism(f"HBase_{side}", 3.2, 2.1, 2.4, 7, (0, 0, 0.6), P["stone_mid"], bevel=0.08, parent=hg)
        add_prism(f"HPeak_{side}", 1.9, 0.6, 2.2, 6, (-side * 0.6, 0.4, 2.2), P["stone_light"], bevel=0.06, parent=hg)
        # Tiny warm distant beacon atop each headland
        add_beveled_box(f"HBeacon_{side}", (0.35, 0.35, 0.45), (-side * 0.6, 0.0, 3.45), P["warm_window"], bevel=0.04, parent=hg)

    export_glb("dawn_breakwater.glb")


def main():
    build_viaduct_bridge()
    build_sea_arch_pillars()
    build_coastal_lamp_pine()
    build_time_tea_pavilion()
    build_arched_footbridge()
    build_mirror_pavilion()
    build_dream_crescent_arch()
    build_star_astrolabe()
    build_harbor_lighthouse()
    build_origami_boat_rainbow()
    build_dawn_breakwater()
    print("All 11 Blender GLB diorama assets generated successfully!")


if __name__ == "__main__":
    main()
