// Starter food list bundled inside the app (works fully offline).
// Format: [name, serving, grams in that serving (or null), kcal for that serving]
//
// grams = null means the dish has no reliable weight (soups, drinks, halo-halo),
// so it can only be logged by serving.
//
// Values are rounded, typical estimates. To improve accuracy, cross-check against
// USDA FoodData Central and the Philippine FNRI Food Composition Tables, then
// raise SEED_VERSION so existing installs pick up the changes.

export const SEED_VERSION = 2;

export const SEED_FOODS = [
  // Rice, bread, grains
  ['White rice, cooked', '1 cup', 158, 205],
  ['Brown rice, cooked', '1 cup', 195, 215],
  ['Garlic fried rice (sinangag)', '1 cup', 160, 280],
  ['Oatmeal, cooked', '1 cup', 234, 150],
  ['Pandesal', '1 piece', 40, 120],
  ['White bread', '1 slice', 28, 75],
  ['Whole wheat bread', '1 slice', 32, 80],
  ['Pasta, cooked', '1 cup', 140, 220],
  ['Instant noodles', '1 pack', 70, 330],
  ['Sweet potato (kamote), boiled', '1 medium', 150, 130],
  ['Potato, boiled', '1 medium', 150, 130],
  ['Corn, boiled', '1 ear', 100, 100],

  // Eggs, meat, fish, protein
  ['Egg, boiled', '1 large', 50, 78],
  ['Egg, fried', '1 large', 46, 90],
  ['Egg white', '1 large', 33, 17],
  ['Chicken breast, cooked, skinless', '100 g', 100, 165],
  ['Chicken thigh, cooked, skinless', '100 g', 100, 209],
  ['Fried chicken', '1 drumstick', 80, 190],
  ['Pork liempo, grilled', '100 g', 100, 400],
  ['Pork chop, cooked', '100 g', 100, 230],
  ['Beef sirloin, cooked', '100 g', 100, 215],
  ['Ground beef (85% lean), cooked', '100 g', 100, 250],
  ['Tilapia, cooked', '100 g', 100, 128],
  ['Bangus (milkfish), fried', '100 g', 100, 190],
  ['Tuna, canned in water', '100 g', 100, 116],
  ['Sardines in tomato sauce', '1 can', 155, 200],
  ['Corned beef, canned', '100 g', 100, 210],
  ['Hotdog', '1 piece', 50, 140],
  ['Longganisa', '1 link', 50, 150],
  ['Tocino', '1 serving', 80, 270],
  ['Beef tapa', '100 g', 100, 220],
  ['Tofu, firm', '100 g', 100, 80],
  ['Whey protein powder', '1 scoop', 30, 120],
  ['Protein bar', '1 bar', 60, 200],
  ['Greek yogurt, plain', '170 g tub', 170, 100],

  // Filipino dishes (home-cooked, varies a lot by recipe)
  ['Chicken adobo', '1 serving (with sauce)', 150, 330],
  ['Pork adobo', '1 serving (with sauce)', 150, 380],
  ['Sinigang na baboy', '1 bowl', null, 250],
  ['Tinola', '1 bowl', null, 180],
  ['Kare-kare', '1 serving', null, 450],
  ['Lechon kawali', '100 g', 100, 470],
  ['Sisig', '1 serving', 150, 450],
  ['Pancit canton, cooked', '1 cup', 140, 250],
  ['Lumpia shanghai', '1 piece', 20, 60],
  ['Tortang talong', '1 serving', 120, 150],
  ['Ginisang monggo', '1 cup', 240, 200],
  ['Lugaw / arroz caldo', '1 bowl', null, 250],
  ['Champorado', '1 bowl', null, 300],
  ['Turon', '1 piece', 80, 200],
  ['Banana cue', '1 stick', 100, 230],
  ['Puto', '1 piece', 40, 70],
  ['Halo-halo', '1 regular glass', null, 350],

  // Fast food (generic)
  ['Cheeseburger', '1 regular', 120, 300],
  ['French fries', '1 medium', 115, 340],
  ['Pizza', '1 slice', 107, 285],

  // Fruit and vegetables
  ['Banana', '1 medium', 118, 105],
  ['Apple', '1 medium', 182, 95],
  ['Orange', '1 medium', 131, 62],
  ['Mango, ripe', '1 cup sliced', 165, 100],
  ['Papaya', '1 cup', 140, 55],
  ['Pineapple', '1 cup', 165, 80],
  ['Watermelon', '1 cup', 152, 46],
  ['Avocado', '1/2 fruit', 100, 160],
  ['Broccoli, cooked', '1 cup', 156, 55],
  ['Kangkong, cooked', '1 cup', 90, 20],
  ['Cabbage, cooked', '1 cup', 150, 35],
  ['Carrot, raw', '1 medium', 61, 25],
  ['Tomato', '1 medium', 123, 22],
  ['Cucumber', '1 cup sliced', 104, 16],

  // Dairy, fats, snacks
  ['Milk, whole', '1 cup', 244, 150],
  ['Milk, skim', '1 cup', 245, 85],
  ['Soy milk, unsweetened', '1 cup', 243, 80],
  ['Cheddar cheese', '1 slice', 28, 113],
  ['Peanut butter', '1 tbsp', 16, 95],
  ['Cooking oil', '1 tbsp', 14, 120],
  ['Butter', '1 tbsp', 14, 100],
  ['Sugar', '1 tsp', 4, 16],
  ['Honey', '1 tbsp', 21, 64],
  ['Peanuts', '28 g', 28, 160],
  ['Almonds', '28 g', 28, 165],
  ['Dark chocolate', '28 g', 28, 170],

  // Drinks
  ['Coffee, black', '1 cup', 237, 2],
  ['Coffee, 3-in-1 sachet', '1 sachet', 20, 80],
  ['Cola', '1 can (330 ml)', 330, 140],
  ['Orange juice', '1 cup', 248, 110],
  ['Milk tea', '1 medium (500 ml)', null, 330],
  ['Beer', '1 bottle (330 ml)', 330, 150],
];