## 2025.06.10 - [cyc]

EXCITED to start this collaborative work! :）

I just created a basic shader with simple position-based coloring.
The shader uses (chaotic) position transformations with Gaussian 
time modulation for organic movement patterns.

Please check README.md first and feel free to add your thoughts!
Looking forward to seeing how you'll respond to this foundation!!!

## 2025.06.11 - [ayumu]

The concept is nice! Clear and well-instracted!
And already the visual is cool😂 Wave manupulation and gaussian blurring feels like magical mathmatical phenomena.
I did minor tweek on output image like modulation, color control with pow().
Today was cloudy/rainy in Tokyo, so I felt like I need a bit of bright/colorful image.


## 2025.06.11 - [cyc]

(was worried yesterday but I'm so happy you like this!😂)

→ js: Added a high-resolution image download feature today! Just press s/S on the screen and you can download the high res image!

→ record folder: Since we can download images now,
I also created a folder to store all the downloaded pictures as a record.
Actually, we can share any files we want!

→ shader: I think the bright colors look amazing!!!
And today I wanted to add a little emphasis to the ripples, so I changed a bit on the color function again.
The screen now has a bit more contrast.
out_0611_01 and out_0611_02 are the beginning and after shots respectively.
I'm not satisfied with how the ripples stack up after a while though.
I need to think about what to work on tomorrow...

Yesterday I got my Fuji film photos 🎞 from last year, and I'm really happy with how they turned out...
I guess I really love highly saturated images.

## 2025.06.12 - [aym]

Thank you for organizing utilities!
Just having fun
I noticed that the stripes got stronger over time, so I changed time to oscillate cause I also really love initial state of gradation :)
Now the pitch of stripe goes back and forth along time.
And added some color modulation to keep complexity in color gradation.
Also added another uv offset like mosaic-patterns.
Let's see if all of them work together...

## 2025.06.12 - [cyc]

I'm late!

I absolutely love the mosaic pattern!
If you take a closer look at the edges in this version, there's this subtle beauty around the perimeter that feels really nice ✨✨
It alo makes the color changes in the center much clearer to see
Amazing!!

I didn’t actually change any color palette today - I'm trying to simulate Caustics to make the ripples on screen more delicate...
Though I haven't finished the area change calculations yet, I should be able to complete it tomorrow
I think we can working on color adjustments next - all the colors 🌈 are currently competing for attention, maybe it's a bit (too) chaotic?
Temporarily comment out the sampleOffset in main() - it was too intense, wanna creating more organic ripples now... 🌊

Caustics reference: https://github.com/shanecelis/water-demo/blob/master/Shaders/Caustics.shader

## 2025.06.13 - [ayumu]

Gorgeous causitics! Organic fluiditiy, complexity
I tried warping rgb to see another possibitlity of color pallettes.
Now it changes color along time, but then it gots awkward black spots😂.
Let me see if I can do anything...
And really minor thing, I added a gray frame with CSS.