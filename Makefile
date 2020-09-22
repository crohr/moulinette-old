MDFILES_IN = $(shell find . -name "*.md" -not -path "./dist/*" | xargs -I{} echo ./dist/{})
MDFILES_OUT = $(MDFILES_IN:.md=.html)
HTMLFILES_IN = $(shell find -name "*.html.erb" -not -path "./includes/*" -not -path "./dist/*" | xargs -I{} echo ./dist/{})
HTMLFILES_OUT = $(HTMLFILES_IN:.html.erb=.html)
PNGFILES_OUT = $(shell mkdir -p img && find img -name "*.png" | xargs -I{} echo ./dist/{})
SVGFILES_OUT = $(shell mkdir -p img && find img -name "*.svg" | xargs -I{} echo ./dist/{})
TEMP:= $(shell mktemp -u /tmp/web.XXXXXX)

all: $(HTMLFILES_OUT) $(MDFILES_OUT) $(PNGFILES_OUT) $(SVGFILES_OUT)
	echo OK > dist/health.html

dist/%.html: %.html.erb includes/*
	mkdir -p $(shell dirname $@)
	./bin/generate $< > $@

dist/%.html: %.md includes/*
	mkdir -p $(shell dirname $@)
	./bin/generate $< > $@

dist/img/%.png: img/%.png
	mkdir -p "$(dir $@)"
	cp $< $@

dist/img/%.svg: img/%.svg
	mkdir -p "$(dir $@)"
	cp $< $@

clean:
	rm -rf dist/*

test:
	docker build -t moulinette-site .
	docker run -it -p 9000:80 moulinette-site

optimize:
	optipng img/**/*.png

.PHONY: all clean
